import { useEffect, useState } from 'react';
import { useSearchParams } from 'react-router-dom';
import api, { errMsg } from '../api';
import ProductCard from '../components/ProductCard';

export default function Home() {
  const [sp, setSp] = useSearchParams();
  const q = sp.get('q') || '';
  const danhMuc = sp.get('danhMuc') || '';
  const sort = sp.get('sort') || 'moi';
  const page = Number(sp.get('page')) || 1;

  const [cats, setCats] = useState([]);
  const [data, setData] = useState({ items: [], total: 0, pages: 1 });
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    api.get('/categories').then((r) => setCats(r.data)).catch(() => {});
  }, []);

  useEffect(() => {
    let off = false;
    setLoading(true);
    setError('');
    api.get('/products', { params: { q, danhMuc, sort, page, limit: 12 } })
      .then((r) => !off && setData(r.data))
      .catch((e) => !off && setError(errMsg(e)))
      .finally(() => !off && setLoading(false));
    return () => { off = true; };
  }, [q, danhMuc, sort, page]);

  const update = (patch) => {
    const n = new URLSearchParams(sp);
    Object.entries(patch).forEach(([k, v]) => (v ? n.set(k, v) : n.delete(k)));
    if (!('page' in patch)) n.delete('page');
    setSp(n);
  };

  return (
    <div className="container page">
      <h1 className="page-title">{q ? <>Kết quả cho “{q}” <span className="sub">({data.total} sản phẩm)</span></> : 'Sản phẩm nổi bật'}</h1>

      <div className="filters">
        <div className="chips">
          <button className={`chip ${!danhMuc ? 'active' : ''}`} onClick={() => update({ danhMuc: '' })}>Tất cả</button>
          {cats.map((c) => (
            <button key={c._id} className={`chip ${danhMuc === c._id ? 'active' : ''}`} onClick={() => update({ danhMuc: c._id })}>{c.tenDanhMuc}</button>
          ))}
        </div>
        <select className="input select" value={sort} onChange={(e) => update({ sort: e.target.value === 'moi' ? '' : e.target.value })} aria-label="Sắp xếp">
          <option value="moi">Mới nhất</option>
          <option value="gia-tang">Giá thấp → cao</option>
          <option value="gia-giam">Giá cao → thấp</option>
        </select>
      </div>

      {error && <div className="alert alert-error">{error}</div>}
      {loading ? (
        <div className="empty">Đang tải sản phẩm...</div>
      ) : data.items.length === 0 && !error ? (
        <div className="empty card">Không tìm thấy sản phẩm phù hợp.</div>
      ) : (
        <div className="grid">{data.items.map((p) => <ProductCard key={p._id} p={p} />)}</div>
      )}

      {data.pages > 1 && (
        <div className="pager">
          <button className="btn btn-outline btn-sm" disabled={page <= 1} onClick={() => update({ page: String(page - 1) })}>← Trước</button>
          <span>Trang {page} / {data.pages}</span>
          <button className="btn btn-outline btn-sm" disabled={page >= data.pages} onClick={() => update({ page: String(page + 1) })}>Sau →</button>
        </div>
      )}
    </div>
  );
}
