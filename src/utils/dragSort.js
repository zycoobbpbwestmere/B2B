import { useState } from 'react';

/** Return a copy of `list` with the item at `from` moved to position `to`. */
export function moveItem(list, from, to) {
  if (from == null || to == null || from === to || from < 0 || to < 0 || from >= list.length || to >= list.length) return list;
  const next = [...list];
  const [moved] = next.splice(from, 1);
  next.splice(to, 0, moved);
  return next;
}

/**
 * HTML5 drag-to-reorder for grids / flex lists — cursor drag, no library.
 *
 * Usage:
 *   const drag = useDragSort((from, to) => setItems((prev) => moveItem(prev, from, to)));
 *   <div {...drag.itemProps(idx)} className={drag.dragging(idx) ? 'opacity-40' : ''}>
 *
 * - OS file drags are ignored here (they bubble to the container's file-drop handler)
 * - `drag.over(idx)` marks the drop target for a highlight ring
 */
export function useDragSort(onMove) {
  const [dragIdx, setDragIdx] = useState(null);
  const [overIdx, setOverIdx] = useState(null);

  const itemProps = (idx) => ({
    draggable: true,
    onDragStart: (e) => {
      setDragIdx(idx);
      setOverIdx(null);
      e.dataTransfer.effectAllowed = 'move';
      e.dataTransfer.setData('text/plain', String(idx));
    },
    onDragOver: (e) => {
      e.preventDefault();
      e.dataTransfer.dropEffect = 'move';
      if (overIdx !== idx) setOverIdx(idx);
    },
    onDrop: (e) => {
      const types = Array.from(e.dataTransfer.types || []);
      if (types.includes('Files')) {
        // A file dragged from the OS — let the outer drop zone handle it.
        e.preventDefault();
        return;
      }
      e.preventDefault();
      e.stopPropagation();
      const from = dragIdx != null ? dragIdx : Number(e.dataTransfer.getData('text/plain'));
      setDragIdx(null);
      setOverIdx(null);
      if (Number.isInteger(from) && from >= 0 && from !== idx) onMove(from, idx);
    },
    onDragEnd: () => {
      setDragIdx(null);
      setOverIdx(null);
    },
  });

  const dragging = (idx) => dragIdx === idx;
  const over = (idx) => overIdx === idx && dragIdx != null && dragIdx !== idx;

  return { itemProps, dragging, over, active: dragIdx != null };
}
