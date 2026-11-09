import { createContext, useCallback, useContext, useEffect, useState } from 'react';
import api from '../api';
import { useAuth } from './AuthContext';

const Ctx = createContext(null);
export const useCart = () => useContext(Ctx);

const EMPTY = { lines: [], soDong: 0, tongSanPham: 0, tongTien: 0 };

export function CartProvider({ children }) {
  const { user } = useAuth();
  const [cart, setCart] = useState(EMPTY);
  const [loading, setLoading] = useState(false);
  // loadedFor = người dùng mà giỏ hàng hiện tại thuộc về; dùng để biết giỏ đã tải xong chưa
  const [loadedFor, setLoadedFor] = useState(null);
  const who = user ? String(user.id) : 'guest';

  const refresh = useCallback(async () => {
    if (!user) {
      setCart(EMPTY);
      setLoadedFor('guest');
      return;
    }
    setLoading(true);
    try {
      setCart((await api.get('/cart')).data);
    } finally {
      setLoading(false);
      setLoadedFor(String(user.id));
    }
  }, [user]);

  useEffect(() => {
    refresh().catch(() => {});
  }, [refresh]);

  const add = async (sanPhamId, soLuong = 1) =>
    setCart((await api.post('/cart/items', { sanPhamId, soLuong })).data);
  const setQty = async (id, soLuong) =>
    setCart((await api.patch(`/cart/items/${id}`, { soLuong })).data);
  const remove = async (id) => setCart((await api.delete(`/cart/items/${id}`)).data);

  return (
    <Ctx.Provider value={{ cart, loading, loaded: loadedFor === who, refresh, add, setQty, remove }}>{children}</Ctx.Provider>
  );
}
