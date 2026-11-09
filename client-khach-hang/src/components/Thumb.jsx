import { useEffect, useState } from 'react';
import { assetUrl } from '../api';

const PAL = [
  ['#6366f1', '#8b5cf6'], ['#0ea5e9', '#38bdf8'], ['#10b981', '#34d399'],
  ['#f59e0b', '#fbbf24'], ['#ec4899', '#f472b6'], ['#14b8a6', '#2dd4bf'],
];

// Ảnh sản phẩm; nếu không có/không tải được thì hiện ô gradient kèm tên (giống mẫu giao diện)
export default function Thumb({ src, name = '', size = 'md' }) {
  const [failed, setFailed] = useState(false);
  useEffect(() => setFailed(false), [src]);
  if (src && !failed) {
    return <img className={`thumb thumb-${size}`} src={assetUrl(src)} alt={name} loading="lazy" onError={() => setFailed(true)} />;
  }
  const h = [...name].reduce((a, c) => a + c.charCodeAt(0), 0);
  const [c1, c2] = PAL[h % PAL.length];
  return (
    <div className={`thumb thumb-${size} thumb-fallback`} style={{ background: `linear-gradient(135deg, ${c1}, ${c2})` }}>
      {name.split(' ').slice(0, 2).join(' ')}
    </div>
  );
}
