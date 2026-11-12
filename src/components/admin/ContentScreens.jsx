import React, { useEffect, useState } from 'react';
import { Reorder } from 'framer-motion';
import { Film, GripVertical, Save } from 'lucide-react';
import CrudSection from './CrudSection';
import MediaUploader from './MediaUploader';
import { getAllContent, upsertContent, deleteContent, toggleContent, reorderContent, newCategory, newTestimonial, newReview, newGalleryItem, newReel } from '../../lib/contentAdmin';
import { uploadProductImage, slugify } from '../../lib/productAdmin';
import { useProducts, useContentRefresh } from '../../context/ZycoonContext';

function useContentSection(key, emptyText) {
  const [items, setItems] = useState([]);
  const refreshSite = useContentRefresh();

  const load = async () => {
    const rows = await getAllContent(key);
    // Gallery & reels are shown sorted by sort_order on the site — mirror that in the admin list.
    setItems(key === 'gallery' || key === 'reels' ? [...rows].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)) : rows);
  };
  useEffect(() => { load(); }, []);

  const save = async (item) => { await upsertContent(key, item); await Promise.all([load(), refreshSite()]); };
  const remove = async (id) => { await deleteContent(key, id); await Promise.all([load(), refreshSite()]); };
  const toggle = async (id) => { await toggleContent(key, id, items); await Promise.all([load(), refreshSite()]); };

  return { items, load, save, remove, toggle, emptyText };
}

function ReorderGrid({ items, onReorder, renderCell }) {
  return (
    <Reorder.Group axis="y" values={items} onReorder={onReorder} className="space-y-2">
      {items.map((item, idx) => (
        <Reorder.Item key={item.id} value={item} className="flex items-center gap-3 border border-border bg-card px-4 py-3 cursor-grab active:cursor-grabbing select-none">
          <GripVertical className="w-4 h-4 text-muted flex-shrink-0" strokeWidth={1.5} />
          <span className="text-[9px] font-mono text-muted w-6 flex-shrink-0">{String(idx + 1).padStart(2, '0')}</span>
          {renderCell(item)}
        </Reorder.Item>
      ))}
    </Reorder.Group>
  );
}

function OrderModeButtons({ onCancel, onSave, saving, dirty }) {
  return (
    <div className="flex items-center justify-end gap-3">
      <button onClick={onCancel} className="px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] text-muted hover:text-ink transition-colors">
        Cancel
      </button>
      <button
        onClick={onSave}
        disabled={saving || !dirty}
        className="flex items-center space-x-2 bg-ink text-ivory px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-espresso transition-colors duration-300 disabled:opacity-50"
      >
        <Save className="w-3.5 h-3.5" strokeWidth={1.5} />
        <span>{saving ? 'Saving…' : 'Save Order'}</span>
      </button>
    </div>
  );
}

/* ── Product Reviews ────────────────────────────────────────── */
export function ReviewsAdmin() {
  const products = useProducts();
  const { items, save, remove, toggle } = useContentSection('reviews', 'No reviews yet.');

  const productName = (id) => products.find((p) => p.id === id)?.name || '(deleted product)';

  return (
    <CrudSection
      eyebrow="Content · Product Reviews"
      title="Client Reviews"
      items={items}
      newItem={newReview}
      idOf={(p) => p.id}
      rowTitle={(r) => r.author}
      rowSub={(r) => `${productName(r.product_id)}${r.comment ? ' — ' + r.comment : ''}`}
      onSave={save}
      onDelete={remove}
      onToggle={toggle}
      emptyText="No reviews yet. Click Add to attach a review to a product."
      countLabel={`${items.length} reviews · shown next to ${products.length} products`}
      fields={[
        { key: 'product_id', label: 'Product', type: 'select', required: true, options: products.map((p) => ({ value: p.id, label: `${p.serial || ''} ${p.name}`.trim() })) },
        { key: 'author', label: 'Author / Company', type: 'text', required: true, placeholder: 'e.g. Vance & Co. Retail Group' },
        { key: 'rating', label: 'Rating (1–5)', type: 'number', min: 1, max: 5 },
        { key: 'comment', label: 'Review', type: 'textarea', rows: 3, placeholder: 'What did they say about this product?' },
      ]}
    />
  );
}

/* ── Site Testimonials ──────────────────────────────────────── */
export function TestimonialsAdmin() {
  const { items, save, remove, toggle } = useContentSection('testimonials', 'No testimonials yet.');

  return (
    <CrudSection
      eyebrow="Content · Site Reviews"
      title="Testimonials (Home Page)"
      items={items}
      newItem={newTestimonial}
      idOf={(t) => t.id}
      rowTitle={(t) => t.client_name}
      rowSub={(t) => `${t.company_name}${t.country ? ' · ' + t.country : ''}`}
      onSave={save}
      onDelete={remove}
      onToggle={toggle}
      emptyText="No testimonials yet. These appear in the Verified Buyer Testimonials section."
      countLabel={`${items.length} testimonials`}
      fields={[
        { key: 'client_name', label: 'Client Name', type: 'text', required: true, placeholder: 'e.g. Marcus Vance' },
        { key: 'company_name', label: 'Company', type: 'text', placeholder: 'e.g. Vance & Co. Retail Group' },
        { key: 'country', label: 'Country', type: 'text', placeholder: 'e.g. United Kingdom' },
        { key: 'quote', label: 'Quote', type: 'textarea', required: true, rows: 4, placeholder: 'Their experience working with Zycoon…' },
        { key: 'rating', label: 'Star Rating (0 = none)', type: 'number', min: 0, max: 5 },
      ]}
    />
  );
}

/* ── Gallery ────────────────────────────────────────────────── */
export function GalleryAdmin() {
  const { items, load, save, remove, toggle } = useContentSection('gallery', 'No gallery entries yet.');
  const refreshSite = useContentRefresh();
  const [orderMode, setOrderMode] = useState(false);
  const [draftOrder, setDraftOrder] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  const startOrder = () => { setDraftOrder([...items]); setOrderMode(true); };
  const cancelOrder = () => { setOrderMode(false); setDraftOrder([]); };
  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderContent('gallery', draftOrder.map((g) => g.id));
      await Promise.all([load(), refreshSite()]);
      setOrderMode(false);
      setDraftOrder([]);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleBulkUpload = async (urls) => {
    // Continue after the highest existing order so the site (sorted by sort_order) shows
    // newly uploaded photos in the exact order they were arranged in the uploader.
    const base = Math.max(0, ...items.map((g) => Number(g.sort_order) || 0));
    for (let i = 0; i < urls.length; i++) {
      const url = urls[i];
      await save({ ...newGalleryItem(), sort_order: base + i + 1, image: url, title: slugify(url.split('/').pop().replace(/\.[^.]+$/, '')).replace(/-/g, ' ') || `Photo ${i + 1}` });
    }
  };

  const dirty = orderMode && draftOrder.map((g) => g.id).join(',') !== items.map((g) => g.id).join(',');

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6">
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted mb-1">Bulk Upload</p>
        <h4 className="text-sm font-serif text-ink mb-4">Add Multiple Photos</h4>
        <MediaUploader accept="image/*" label="photos" slugPrefix="gallery" multi onUploaded={handleBulkUpload} />
      </div>

      {!orderMode && items.length > 1 && (
        <div className="flex justify-end">
          <button onClick={startOrder} className="text-[10px] uppercase tracking-wider text-muted hover:text-leather transition-colors">
            Reorder Photos
          </button>
        </div>
      )}

      {orderMode && (
        <div className="space-y-4">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted">Drag to reorder · then Save Order</p>
          <ReorderGrid
            items={draftOrder}
            onReorder={setDraftOrder}
            renderCell={(g) => (
              <div className="flex items-center gap-3 min-w-0 flex-1">
                {g.image ? (
                  <img src={g.image} alt="" className="w-10 h-10 object-cover border border-border flex-shrink-0" />
                ) : (
                  <div className="w-10 h-10 border border-dashed border-border bg-ivory flex-shrink-0" />
                )}
                <p className="text-xs text-ink truncate">{g.title}</p>
              </div>
            )}
          />
          <OrderModeButtons onCancel={cancelOrder} onSave={saveOrder} saving={savingOrder} dirty={dirty} />
        </div>
      )}

      {!orderMode && (
        <CrudSection
          eyebrow="Content · Workshop Gallery"
          title="Gallery Images"
          items={items}
          newItem={newGalleryItem}
          idOf={(g) => g.id}
          previewKey="image"
          rowTitle={(g) => g.title}
          rowSub={(g) => g.description || (g.category_id ? g.category_id : '')}
          onSave={save}
          onDelete={remove}
          onToggle={toggle}
          onUpload={(file) => uploadProductImage(file, 'gallery')}
          emptyText="No gallery entries yet. Add workshop or product photos."
          countLabel={`${items.length} photos`}
          fields={[
            { key: 'image', label: 'Photo or Color', type: 'image' },
            { key: 'title', label: 'Title', type: 'text', required: true, placeholder: 'e.g. Precision Hydraulic Die Cutting' },
            { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
            { key: 'sort_order', label: 'Order', type: 'number' },
          ]}
        />
      )}
    </div>
  );
}

/* ── Reels ─────────────────────────────────────────────────── */
export function ReelsAdmin() {
  const { items, load, save, remove, toggle } = useContentSection('reels', 'No reels yet.');
  const refreshSite = useContentRefresh();
  const [orderMode, setOrderMode] = useState(false);
  const [draftOrder, setDraftOrder] = useState([]);
  const [savingOrder, setSavingOrder] = useState(false);

  const startOrder = () => { setDraftOrder([...items]); setOrderMode(true); };
  const cancelOrder = () => { setOrderMode(false); setDraftOrder([]); };
  const saveOrder = async () => {
    setSavingOrder(true);
    try {
      await reorderContent('reels', draftOrder.map((r) => r.id));
      await Promise.all([load(), refreshSite()]);
      setOrderMode(false);
      setDraftOrder([]);
    } finally {
      setSavingOrder(false);
    }
  };

  const handleBulkUpload = async (urls) => {
    // Continue after the highest existing order so videos keep the arranged uploader sequence.
    const base = Math.max(0, ...items.map((r) => Number(r.sort_order) || 0));
    for (let i = 0; i < urls.length; i++) {
      await save({ ...newReel(), sort_order: base + i + 1, video_url: urls[i], caption: `Sample Reel ${String(i + 1).padStart(2, '0')}` });
    }
  };

  const dirty = orderMode && draftOrder.map((r) => r.id).join(',') !== items.map((r) => r.id).join(',');

  return (
    <div className="space-y-6">
      <div className="border border-border bg-card p-6">
        <p className="text-[9px] font-mono uppercase tracking-[0.3em] text-muted mb-1">Bulk Upload</p>
        <h4 className="text-sm font-serif text-ink mb-4">Add Multiple Reel Videos</h4>
        <MediaUploader accept="video/*" label="videos" slugPrefix="reel" multi onUploaded={handleBulkUpload} />
      </div>

      {!orderMode && items.length > 1 && (
        <div className="flex justify-end">
          <button onClick={startOrder} className="text-[10px] uppercase tracking-wider text-muted hover:text-leather transition-colors">
            Reorder Reels
          </button>
        </div>
      )}

      {orderMode && (
        <div className="space-y-4">
          <p className="text-[9px] font-mono uppercase tracking-wider text-muted">Drag to reorder · then Save Order</p>
          <ReorderGrid
            items={draftOrder}
            onReorder={setDraftOrder}
            renderCell={(r) => (
              <div className="flex items-center gap-3 min-w-0 flex-1">
                <div className="w-10 h-14 border border-border bg-ivory flex items-center justify-center flex-shrink-0">
                  <Film className="w-4 h-4 text-muted" strokeWidth={1.5} />
                </div>
                <p className="text-xs text-ink truncate">{r.caption || 'Untitled reel'}</p>
              </div>
            )}
          />
          <OrderModeButtons onCancel={cancelOrder} onSave={saveOrder} saving={savingOrder} dirty={dirty} />
        </div>
      )}

      {!orderMode && (
        <CrudSection
          eyebrow="Content · Reels"
          title="Reel Videos"
          items={items}
          newItem={newReel}
          idOf={(r) => r.id}
          previewKey="video_url"
          rowTitle={(r) => r.caption || 'Untitled reel'}
          rowSub={(r) => r.video_url}
          onSave={save}
          onDelete={remove}
          onToggle={toggle}
          emptyText="No reels yet. Upload videos above or add one manually."
          countLabel={`${items.length} reels`}
          fields={[
            { key: 'video_url', label: 'Video URL', type: 'text', required: true, placeholder: 'https://…mp4' },
            { key: 'caption', label: 'Caption', type: 'text', placeholder: 'e.g. Workshop Craft Detail' },
            { key: 'sort_order', label: 'Order', type: 'number' },
          ]}
        />
      )}
    </div>
  );
}

/* ── Categories ─────────────────────────────────────────────── */
export function CategoriesAdmin() {
  const { items, save, remove, toggle } = useContentSection('categories', 'No categories yet.');

  return (
    <CrudSection
      eyebrow="Taxonomy · Categories"
      title="Product Categories"
      items={items}
      newItem={newCategory}
      idOf={(c) => c.id || c.slug}
      previewKey="image_color"
      rowTitle={(c) => c.name}
      rowSub={(c) => c.description}
      onSave={save}
      onDelete={remove}
      onToggle={toggle}
      autoSlug
      emptyText="No categories yet. New categories appear in the Products form and category filters."
      countLabel={`${items.length} categories · selectable when adding a product`}
      fields={[
        { key: 'name', label: 'Category Name', type: 'text', required: true, placeholder: 'e.g. Wallets & Small Goods' },
        { key: 'slug', label: 'Slug', type: 'text', required: true, placeholder: 'e.g. wallets' },
        { key: 'description', label: 'Description', type: 'textarea', rows: 3 },
        { key: 'image_color', label: 'Swatch Color', type: 'hex' },
      ]}
    />
  );
}