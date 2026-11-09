import { useEffect, useRef, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import api from '../api';
import Thumb from '../components/Thumb';
import { fmtMoney } from '../utils';

const GREETING = {
  id: 'greeting', role: 'ai',
  text: 'Xin chào! Mình là trợ lý AI của Sàn Online. Mình có thể tư vấn sản phẩm và giải đáp thắc mắc mua sắm cho bạn.',
};
const QUICK = ['Gợi ý sản phẩm bán chạy', 'Cách đặt hàng', 'Theo dõi đơn hàng'];

export default function Chat() {
  const navigate = useNavigate();
  const [msgs, setMsgs] = useState([GREETING]);
  const [text, setText] = useState('');
  const [busy, setBusy] = useState(false);
  const endRef = useRef(null);

  // Tải lịch sử trò chuyện đã lưu trong collection TinNhanAI
  useEffect(() => {
    api.get('/chat').then((r) => {
      const hist = r.data.flatMap((m) => [
        { id: `${m._id}q`, role: 'me', text: m.cauHoi },
        { id: `${m._id}a`, role: 'ai', text: m.cauTraLoi },
      ]);
      setMsgs([GREETING, ...hist]);
    }).catch(() => {});
  }, []);

  useEffect(() => { endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' }); }, [msgs, busy]);

  const send = async (content) => {
    const q = (content ?? text).trim();
    if (!q || busy) return;
    setText('');
    setMsgs((m) => [...m, { id: `u${Date.now()}`, role: 'me', text: q }]);
    setBusy(true);
    try {
      const { data } = await api.post('/chat', { cauHoi: q });
      setMsgs((m) => [...m, { id: data.tinNhan._id, role: 'ai', text: data.tinNhan.cauTraLoi, products: data.sanPhamGoiY }]);
    } catch {
      setMsgs((m) => [...m, { id: `e${Date.now()}`, role: 'ai', error: true, text: 'Xin lỗi, hiện chưa thể trả lời. Vui lòng thử lại sau.' }]);
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="container page">
      <div className="chat card">
        <div className="chat-head">
          <span className="avatar">AI</span>
          <div className="grow"><b>Chatbox AI – Trợ lý mua sắm</b><div className="small op">Đang trực tuyến</div></div>
          <button className="x" onClick={() => navigate(-1)} aria-label="Đóng">×</button>
        </div>
        <div className="chat-body">
          {msgs.map((m) => (
            <div key={m.id} className={`msg ${m.role}`}>
              {m.role === 'ai' && <span className="avatar ai-av">AI</span>}
              <div className={`bubble ${m.error ? 'err' : ''}`}>
                <div className="pre">{m.text}</div>
                {m.products?.length > 0 && (
                  <div className="sug-list">
                    {m.products.map((p) => (
                      <Link key={p._id} to={`/san-pham/${p._id}`} className="sug">
                        <Thumb src={p.hinhAnh} name={p.tenSanPham} size="xs" />
                        <div className="grow"><div className="strong">{p.tenSanPham}</div><div className="muted small">{p.tenGianHang}</div></div>
                        <b className="price">{fmtMoney(p.giaSanPham)}</b>
                      </Link>
                    ))}
                  </div>
                )}
              </div>
            </div>
          ))}
          {busy && <div className="msg ai"><span className="avatar ai-av">AI</span><div className="bubble typing">Đang trả lời…</div></div>}
          <div ref={endRef} />
        </div>
        <div className="quick">
          {QUICK.map((q) => <button key={q} className="chip" disabled={busy} onClick={() => send(q)}>{q}</button>)}
        </div>
        <form className="chat-input" onSubmit={(e) => { e.preventDefault(); send(); }}>
          <input className="input" value={text} maxLength={500} onChange={(e) => setText(e.target.value)} placeholder="Nhập câu hỏi về sản phẩm hoặc mua sắm..." />
          <button className="btn btn-primary" disabled={busy || !text.trim()}>Gửi</button>
        </form>
      </div>
    </div>
  );
}
