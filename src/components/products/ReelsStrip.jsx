import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';
import { Play } from 'lucide-react';
import { reels as seedReels } from '../../data/reels';
import { getAllContent } from '../../lib/contentAdmin';

const EASE_OUT = [0.23, 1, 0.32, 1];

export default function ReelsStrip() {
  const [reels, setReels] = useState(seedReels);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      const data = await getAllContent('reels');
      if (!cancelled && data && data.length) setReels([...data].sort((a, b) => (a.sort_order || 0) - (b.sort_order || 0)));
    })();
    return () => { cancelled = true; };
  }, []);

  if (!reels.length) return null;

  return (
    <section className="mb-12 lg:mb-16">
      <div className="flex flex-wrap items-end justify-between gap-x-6 gap-y-3 mb-5">
        <div>
          <h2 className="text-2xl lg:text-3xl font-serif text-ink leading-none">Reels</h2>
          <p className="text-[11px] text-muted font-light mt-2 max-w-md leading-relaxed">
            Behind-the-scenes reels from our factory floor, materials and finished bags.
          </p>
        </div>
        <span className="stamp text-muted border-border">{String(reels.length).padStart(2, '0')} Reels</span>
      </div>

      <div className="flex gap-4 overflow-x-auto snap-x snap-mandatory -mx-6 px-6 lg:mx-0 lg:px-0 pb-3">
        {reels.map((reel, idx) => (
          <motion.div
            key={reel.id}
            initial={{ opacity: 0, y: 20 }}
            whileInView={{ opacity: 1, y: 0 }}
            viewport={{ once: true, amount: 0.2 }}
            transition={{ duration: 0.5, delay: idx * 0.06, ease: EASE_OUT }}
            className="snap-start shrink-0 w-[58%] sm:w-[36%] md:w-[28%] lg:w-auto lg:flex-1 lg:min-w-0"
          >
            <div className="relative aspect-[9/16] border border-border bg-card hover:border-leather/40 transition-colors duration-300 overflow-hidden">
              {reel.video_url ? (
                <video
                  src={reel.video_url}
                  controls
                  playsInline
                  muted
                  preload="metadata"
                  className="w-full h-full object-cover"
                />
              ) : (
                <>
                  <div className="absolute inset-0 leather-grain opacity-[0.05] pointer-events-none" />
                  <div className="absolute inset-0 flex flex-col items-center justify-center gap-3">
                    <span className="w-12 h-12 border border-border bg-ivory flex items-center justify-center text-muted">
                      <Play className="w-4 h-4" strokeWidth={1.5} />
                    </span>
                    <span className="text-[9px] font-mono uppercase tracking-[0.2em] text-muted">No video</span>
                  </div>
                </>
              )}

              {reel.caption && (
                <div className="absolute inset-x-0 bottom-0 px-3 py-2.5 border-t border-border-light bg-ivory/70">
                  <span className="text-[9px] font-mono uppercase tracking-wider text-muted truncate block">{reel.caption}</span>
                </div>
              )}
            </div>
          </motion.div>
        ))}
      </div>

      <p className="text-[10px] font-mono uppercase tracking-wider text-muted mt-1 lg:hidden">
        Swipe for more →
      </p>
    </section>
  );
}
