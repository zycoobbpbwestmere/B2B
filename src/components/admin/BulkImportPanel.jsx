import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, ImageOff, GripVertical } from 'lucide-react';
import { uploadProductImage, upsertProduct, slugify, newProductShape } from '../../lib/productAdmin';
import { useDragSort, moveItem } from '../../utils/dragSort';

const IMPORTED_CATEGORY = 'imported';

function nameFromFilename(filename) {
  const base = filename.replace(/\.[a-z0-9]+$/i, '').replace(/[-_]+/g, ' ').replace(/\s+/g, ' ').trim();
  const titled = base.split(' ').filter(Boolean).map((w) => w.charAt(0).toUpperCase() + w.slice(1)).join(' ');
  return titled || 'Imported Product';
}

export default function BulkImportPanel({ onSaved }) {
  const [items, setItems] = useState([]); // { file, preview }
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [succeeded, setSucceeded] = useState(null);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);
  const drag = useDragSort((from, to) => setItems((prev) => moveItem(prev, from, to)));

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setItems((prev) => {
      const seen = new Set(prev.map((it) => `${it.file.name}-${it.file.size}`));
      const added = picked
        .filter((f) => !seen.has(`${f.name}-${f.size}`))
        .map((f) => ({ file: f, preview: URL.createObjectURL(f) }));
      return [...prev, ...added];
    });
    e.target.value = '';
  };

  const removeAt = (idx) => {
    setItems((prev) => {
      URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const reset = () => {
    items.forEach((it) => URL.revokeObjectURL(it.preview));
    setItems([]);
    setSucceeded(null);
    setErrors([]);
    setCurrent(0);
    setCurrentName('');
  };

  const startUpload = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    setErrors([]);
    setSucceeded(null);
    let ok = 0;
    let fail = 0;

    for (let i = 0; i < items.length; i++) {
      const { file } = items[i];
      setCurrent(i + 1);
      setCurrentName(file.name);
      try {
        const url = await uploadProductImage(file, `imported-${slugify(nameFromFilename(file.name))}`);
        const name = nameFromFilename(file.name);
        await upsertProduct({
          ...newProductShape(),
          id: `imported-${Date.now()}-${i}`,
          name,
          slug: `${slugify(name)}-${Date.now().toString(36)}-${i}`,
          serial: '',
          category_id: IMPORTED_CATEGORY,
          description: '',
          images: [url],
          active: true,
        });
        ok += 1;
      } catch (e) {
        fail += 1;
        setErrors((prev) => [...prev, `${file.name} — ${e?.message || 'failed'}`]);
      }
    }

    setBusy(false);
    setSucceeded({ ok, fail });
    setCurrent(0);
    setCurrentName('');
    items.forEach((it) => URL.revokeObjectURL(it.preview));
    setItems([]);
    if (typeof onSaved === 'function') onSaved();
  };

  return (
    <div className="space-y-6">
      {/* Intro */}
      <div className="border border-border bg-ivory p-6 space-y-2">
        <h3 className="text-lg font-serif text-ink">Bulk add imported products</h3>
        <p className="text-xs text-muted leading-relaxed">
          Select 20–30 product photos at once. Each image is uploaded and created as a product under the{' '}
          <span className="font-semibold text-ink">Imported</span> category, which is what the public Import &amp; Sourcing page displays.
          Names are derived from filenames — edit any product later from the Products tab.
        </p>
      </div>

      {/* Controls */}
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept="image/*"
          multiple
          className="hidden"
          onChange={pickFiles}
          disabled={busy}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="bg-ink text-ivory px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-espresso transition-colors duration-300 disabled:opacity-50"
        >
          <Upload className="w-3.5 h-3.5 inline mr-2 -mt-0.5" strokeWidth={1.5} />
          Choose images ({items.length})
        </button>
        {items.length > 0 && !busy && (
          <button
            onClick={startUpload}
            className="border border-border text-ink px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:border-leather hover:text-leather transition-colors duration-300"
          >
            Upload {items.length} as products
          </button>
        )}
        {items.length > 0 && !busy && (
          <button onClick={reset} className="text-[10px] uppercase tracking-wider text-muted hover:text-ink transition-colors">
            Clear selection
          </button>
        )}
        {items.length > 1 && !busy && (
          <p className="w-full text-[9px] font-mono uppercase tracking-wider text-muted">
            Drag tiles to set the processing order — products are created in this sequence
          </p>
        )}
      </div>

      {/* Progress */}
      {busy && (
        <div className="border border-gold/40 bg-gold/5 px-4 py-3.5 text-xs text-ink font-medium">
          Uploading {current} / {items.length} — {currentName}
          <div className="mt-2 h-1 bg-border-light overflow-hidden">
            <div
              className="h-full bg-gold transition-all duration-300"
              style={{ width: `${Math.round((current / Math.max(items.length, 1)) * 100)}%` }}
            />
          </div>
        </div>
      )}

      {/* Result */}
      {succeeded && (
        <div className="border border-leather/40 bg-leather/5 px-4 py-3.5 text-xs text-ink flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-leather mt-0.5" strokeWidth={1.5} />
          <span>
            {succeeded.ok} product{succeeded.ok === 1 ? '' : 's'} added under the Imported category.
            {succeeded.fail > 0 && ` ${succeeded.fail} failed — see errors below.`} They now appear on the Import &amp; Sourcing page.
          </span>
        </div>
      )}

      {errors.length > 0 && (
        <div className="border border-burgundy/30 bg-burgundy/5 px-4 py-3.5 text-xs text-burgundy space-y-1">
          {errors.map((err, i) => (
            <p key={i} className="flex items-start space-x-2">
              <AlertCircle className="w-3.5 h-3.5 flex-shrink-0 mt-0.5" strokeWidth={1.5} />
              <span>{err}</span>
            </p>
          ))}
        </div>
      )}

      {/* Preview grid */}
      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {items.map((it, idx) => (
            <div
              key={`${it.file.name}-${it.file.size}`}
              {...drag.itemProps(idx)}
              className={`relative border bg-ivory aspect-[4/5] overflow-hidden group select-none cursor-grab active:cursor-grabbing transition-[opacity,border-color,box-shadow] ${drag.dragging(idx) ? 'opacity-40 border-leather' : drag.over(idx) ? 'border-leather shadow-[0_0_0_2px_rgba(112,72,47,0.35)]' : 'border-border'}`}
            >
              <span className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 bg-ink/80 text-ivory text-[9px] font-mono leading-none flex items-center justify-center z-10">
                {String(idx + 1).padStart(2, '0')}
              </span>
              <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                <GripVertical className="w-4 h-4 text-ivory drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" strokeWidth={1.5} />
              </div>
              <img src={it.preview} alt={it.file.name} className="w-full h-full object-cover" />
              {!busy && (
                <button
                  onClick={() => removeAt(idx)}
                  className="absolute top-1 right-1 w-6 h-6 bg-ink/80 text-ivory flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity duration-200"
                  aria-label={`Remove ${it.file.name}`}
                >
                  <X className="w-3.5 h-3.5" strokeWidth={1.5} />
                </button>
              )}
              <div className="absolute inset-x-0 bottom-0 bg-ivory/85 px-2 py-1.5">
                <p className="text-[9px] font-mono text-muted truncate">{it.file.name}</p>
              </div>
              {busy && idx < current - 1 && (
                <div className="absolute inset-0 bg-ivory/60 flex items-center justify-center">
                  <CheckCircle2 className="w-5 h-5 text-leather" strokeWidth={1.5} />
                </div>
              )}
              {busy && idx === current - 1 && (
                <div className="absolute inset-0 bg-gold/20 flex items-center justify-center">
                  <Upload className="w-5 h-5 text-ink animate-pulse" strokeWidth={1.5} />
                </div>
              )}
              {busy && idx > current - 1 && (
                <div className="absolute inset-0 bg-ivory/40 flex items-center justify-center">
                  <ImageOff className="w-4 h-4 text-muted/50" strokeWidth={1.5} />
                </div>
              )}
            </div>
          ))}
        </div>
      )}

      {/* Empty state */}
      {items.length === 0 && !busy && !succeeded && (
        <div className="border border-dashed border-border bg-card py-14 text-center">
          <Upload className="w-6 h-6 text-muted mx-auto" strokeWidth={1.5} />
          <p className="text-xs text-muted mt-3">No images selected yet — choose 20–30 photos to bulk add.</p>
        </div>
      )}
    </div>
  );
}
