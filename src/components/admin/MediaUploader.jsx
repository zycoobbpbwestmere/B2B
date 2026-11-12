import React, { useRef, useState } from 'react';
import { Upload, X, CheckCircle2, AlertCircle, ImageOff, Film, GripVertical } from 'lucide-react';
import { uploadProductImage, slugify } from '../../lib/productAdmin';
import { useDragSort, moveItem } from '../../utils/dragSort';

export default function MediaUploader({ accept = 'image/*', label = 'images', slugPrefix = 'media', onUploaded, multi = true }) {
  const [items, setItems] = useState([]);
  const [busy, setBusy] = useState(false);
  const [current, setCurrent] = useState(0);
  const [currentName, setCurrentName] = useState('');
  const [succeeded, setSucceeded] = useState(null);
  const [errors, setErrors] = useState([]);
  const inputRef = useRef(null);
  const drag = useDragSort((from, to) => setItems((prev) => moveItem(prev, from, to)));

  const isVideo = accept.includes('video');

  const pickFiles = (e) => {
    const picked = Array.from(e.target.files || []);
    setItems((prev) => {
      const seen = new Set(prev.map((it) => `${it.file.name}-${it.file.size}`));
      const added = picked
        .filter((f) => !seen.has(`${f.name}-${f.size}`))
        .map((f) => ({ file: f, preview: isVideo ? '' : URL.createObjectURL(f) }));
      return multi ? [...prev, ...added] : added.slice(0, 1);
    });
    e.target.value = '';
  };

  const removeAt = (idx) => {
    setItems((prev) => {
      if (prev[idx].preview) URL.revokeObjectURL(prev[idx].preview);
      return prev.filter((_, i) => i !== idx);
    });
  };

  const startUpload = async () => {
    if (!items.length || busy) return;
    setBusy(true);
    setErrors([]);
    setSucceeded(null);
    let ok = 0;
    let fail = 0;
    const results = [];

    for (let i = 0; i < items.length; i++) {
      const { file } = items[i];
      setCurrent(i + 1);
      setCurrentName(file.name);
      try {
        const url = await uploadProductImage(file, `${slugPrefix}-${slugify(file.name.replace(/\.[^.]+$/, ''))}`);
        results.push(url);
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
    items.forEach((it) => { if (it.preview) URL.revokeObjectURL(it.preview); });
    setItems([]);
    if (typeof onUploaded === 'function') onUploaded(results, { ok, fail });
  };

  return (
    <div
      onDragOver={(e) => { e.preventDefault(); e.currentTarget.classList.add('border-leather'); }}
      onDragLeave={(e) => { e.currentTarget.classList.remove('border-leather'); }}
      onDrop={(e) => { e.preventDefault(); e.currentTarget.classList.remove('border-leather'); if (busy) return; pickFiles({ target: { files: e.dataTransfer.files }, preventDefault: () => {} }); }}
      className="space-y-4"
    >
      <div className="flex flex-wrap items-center gap-3">
        <input
          ref={inputRef}
          type="file"
          accept={accept}
          multiple={multi}
          className="hidden"
          onChange={pickFiles}
          disabled={busy}
        />
        <button
          onClick={() => inputRef.current?.click()}
          disabled={busy}
          className="bg-ink text-ivory px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:bg-espresso transition-colors duration-300 disabled:opacity-50"
        >
          {isVideo ? <Film className="w-3.5 h-3.5 inline mr-2 -mt-0.5" strokeWidth={1.5} /> : <Upload className="w-3.5 h-3.5 inline mr-2 -mt-0.5" strokeWidth={1.5} />}
          Choose {label} ({items.length})
        </button>
        {items.length > 0 && !busy && (
          <button
            onClick={startUpload}
            className="border border-border text-ink px-5 py-2.5 text-[10px] uppercase tracking-[0.2em] font-medium hover:border-leather hover:text-leather transition-colors duration-300"
          >
            Upload {items.length} {label}
          </button>
        )}
        {items.length > 0 && !busy && (
          <button onClick={() => { items.forEach((it) => { if (it.preview) URL.revokeObjectURL(it.preview); }); setItems([]); setSucceeded(null); setErrors([]); }} className="text-[10px] uppercase tracking-wider text-muted hover:text-ink transition-colors">
            Clear
          </button>
        )}
        {items.length > 1 && !busy && (
          <p className="w-full text-[9px] font-mono uppercase tracking-wider text-muted">
            Drag tiles to set the upload order — uploads follow this sequence
          </p>
        )}
      </div>

      {busy && (
        <div className="border border-gold/40 bg-gold/5 px-4 py-3.5 text-xs text-ink font-medium">
          Uploading {current} / {items.length} — {currentName}
          <div className="mt-2 h-1 bg-border-light overflow-hidden">
            <div className="h-full bg-gold transition-all duration-300" style={{ width: `${Math.round((current / Math.max(items.length, 1)) * 100)}%` }} />
          </div>
        </div>
      )}

      {succeeded && (
        <div className="border border-leather/40 bg-leather/5 px-4 py-3.5 text-xs text-ink flex items-start space-x-2">
          <CheckCircle2 className="w-4 h-4 flex-shrink-0 text-leather mt-0.5" strokeWidth={1.5} />
          <span>
            {succeeded.ok} {label} uploaded{succeeded.fail > 0 ? ` · ${succeeded.fail} failed` : ''}.
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

      {items.length > 0 && (
        <div className="grid grid-cols-3 sm:grid-cols-4 md:grid-cols-6 gap-3">
          {items.map((it, idx) => (
            <div
              key={`${it.file.name}-${it.file.size}`}
              {...drag.itemProps(idx)}
              className={`relative border bg-ivory aspect-square overflow-hidden group select-none cursor-grab active:cursor-grabbing transition-[opacity,border-color,box-shadow] ${drag.dragging(idx) ? 'opacity-40 border-leather' : drag.over(idx) ? 'border-leather shadow-[0_0_0_2px_rgba(112,72,47,0.35)]' : 'border-border'}`}
            >
              <span className="absolute top-1 left-1 min-w-[18px] h-[18px] px-1 bg-ink/80 text-ivory text-[9px] font-mono leading-none flex items-center justify-center z-10">
                {String(idx + 1).padStart(2, '0')}
              </span>
              {!busy && (
                <div className="absolute top-1 left-1/2 -translate-x-1/2 opacity-0 group-hover:opacity-100 transition-opacity duration-200 pointer-events-none z-10">
                  <GripVertical className="w-4 h-4 text-ivory drop-shadow-[0_1px_2px_rgba(0,0,0,0.6)]" strokeWidth={1.5} />
                </div>
              )}
              {it.preview ? (
                <img src={it.preview} alt={it.file.name} className="w-full h-full object-cover" />
              ) : (
                <div className="w-full h-full flex items-center justify-center">
                  <Film className="w-5 h-5 text-muted" strokeWidth={1.5} />
                </div>
              )}
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

      {items.length === 0 && !busy && !succeeded && (
        <div className="border border-dashed border-border bg-card py-10 text-center">
          <Upload className="w-6 h-6 text-muted mx-auto" strokeWidth={1.5} />
          <p className="text-xs text-muted mt-3">Drag {label} here or click Choose {label}.</p>
        </div>
      )}
    </div>
  );
}
