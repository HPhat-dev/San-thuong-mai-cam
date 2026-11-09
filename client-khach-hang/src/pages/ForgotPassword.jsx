import { useState } from 'react';
import { Link } from 'react-router-dom';
import api, { errMsg } from '../api';
import { EMAIL_RE } from '../utils';

// Bước 1: nhập email → hệ thống kiểm tra; Bước 2: đặt mật khẩu mới; Bước 3: hoàn tất
export default function ForgotPassword() {
  const [step, setStep] = useState(1);
  const [email, setEmail] = useState('');
  const [token, setToken] = useState('');
  const [pw, setPw] = useState('');
  const [pw2, setPw2] = useState('');
  const [error, setError] = useState('');
  const [busy, setBusy] = useState(false);

  const verify = async (e) => {
    e.preventDefault();
    setError('');
    if (!EMAIL_RE.test(email.trim())) return setError('Email không hợp lệ');
    setBusy(true);
    try {
      const { data } = await api.post('/auth/forgot-password', { email: email.trim() });
      setToken(data.resetToken);
      setStep(2);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  const reset = async (e) => {
    e.preventDefault();
    setError('');
    if (pw.length < 6) return setError('Mật khẩu tối thiểu 6 ký tự');
    if (pw !== pw2) return setError('Mật khẩu xác nhận không trùng khớp');
    setBusy(true);
    try {
      await api.post('/auth/reset-password', { resetToken: token, matKhauMoi: pw });
      setStep(3);
    } catch (err) {
      setError(errMsg(err));
    } finally {
      setBusy(false);
    }
  };

  return (
    <div className="auth-wrap">
      <div className="auth-card card">
        <h1>Quên mật khẩu</h1>
        {error && <div className="alert alert-error">{error}</div>}
        {step === 1 && (
          <form onSubmit={verify}>
            <p className="muted">Nhập email đã đăng ký để đặt lại mật khẩu.</p>
            <label className="field"><span className="label">Email</span>
              <input className="input" type="email" value={email} onChange={(e) => setEmail(e.target.value)} autoFocus /></label>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Đang kiểm tra...' : 'Tiếp tục'}</button>
          </form>
        )}
        {step === 2 && (
          <form onSubmit={reset}>
            <p className="muted">Tạo mật khẩu mới cho tài khoản <b>{email}</b>.</p>
            <label className="field"><span className="label">Mật khẩu mới</span>
              <input className="input" type="password" value={pw} onChange={(e) => setPw(e.target.value)} autoComplete="new-password" autoFocus /></label>
            <label className="field"><span className="label">Xác nhận mật khẩu mới</span>
              <input className="input" type="password" value={pw2} onChange={(e) => setPw2(e.target.value)} autoComplete="new-password" /></label>
            <button className="btn btn-primary btn-block" disabled={busy}>{busy ? 'Đang lưu...' : 'Đặt lại mật khẩu'}</button>
          </form>
        )}
        {step === 3 && (
          <>
            <div className="alert alert-ok">Đặt lại mật khẩu thành công. Bạn có thể đăng nhập bằng mật khẩu mới.</div>
            <Link to="/dang-nhap" className="btn btn-primary btn-block">Về trang đăng nhập</Link>
          </>
        )}
        {step !== 3 && <p className="center muted"><Link to="/dang-nhap" className="link">← Quay lại đăng nhập</Link></p>}
      </div>
    </div>
  );
}
