import React from 'react'

const ICONS = {
  'chart-line': 'M3 17l6-6 4 4 6-10M21 21H3',
  'warehouse': 'M3 20V8l9-5 9 5v12H3M7 10h2v8H7m4-8h2v8h-2m4-8h2v8h-2',
  'box': 'M3 7l9-4 9 4-9 4-9-4m0 4l9 4 9-4M3 7v10l9 4 9-4V7',
  'arrows-left-right': 'M7 7l-4 4 4 4M17 7l4 4-4 4M3 11h18',
  'clipboard-list': 'M9 3h6a2 2 0 012 2v14a2 2 0 01-2 2H9a2 2 0 01-2-2V5a2 2 0 012-2m0 0V1h6v2M8 9h8M8 13h8M8 17h8',
  'file-lines': 'M14 2H6a2 2 0 00-2 2v16a2 2 0 002 2h12V8l-4-6zM8 10h8M8 14h8M8 18h8',
  'list-check': 'M4 6h10M4 10h10M4 14h10M16 6l2 2 4-4M16 10l2 2 4-4',
  'rotate': 'M12 2v4l3-3A8 8 0 114 6',
  'plus': 'M12 5v14M5 12h14',
  'check': 'M5 13l4 4L19 7',
  'xmark': 'M6 6l12 12M6 18L18 6',
  'pen': 'M4 20l4-1 9-9-3-3-9 9-1 4zM14 5l3 3',
  'trash': 'M6 7h12M9 7V5h6v2M7 7l1 12h8l1-12',
};

export function Icon({ name, size = 16 }) {
  const d = ICONS[name] || ICONS['box'];
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round" style={{display:'inline-block'}}>
      <path d={d} />
    </svg>
  );
}