import { createContext, useContext, useEffect, useState } from 'react';
import api from '../api';

const Ctx = createContext(null);
export const useAuth = () => useContext(Ctx);

export function AuthProvider({ children }) {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(!!localStorage.getItem('token'));

  useEffect(() => {
    if (!localStorage.getItem('token')) return;
    api.get('/profile')
      .then((r) => setUser(r.data))
      .catch(() => {}) // 401 đã được interceptor xử lý
      .finally(() => setLoading(false));
  }, []);

  useEffect(() => {
    const onExpired = () => setUser(null);
    window.addEventListener('auth:expired', onExpired);
    return () => window.removeEventListener('auth:expired', onExpired);
  }, []);

  const start = ({ token, user: u }) => {
    localStorage.setItem('token', token);
    setUser(u);
  };
  const login = async (identifier, matKhau) =>
    start((await api.post('/auth/login', { identifier, matKhau })).data);
  const register = async (form) => start((await api.post('/auth/register', form)).data);
  const logout = () => {
    localStorage.removeItem('token');
    setUser(null);
  };

  return (
    <Ctx.Provider value={{ user, loading, login, register, logout, setUser }}>{children}</Ctx.Provider>
  );
}
