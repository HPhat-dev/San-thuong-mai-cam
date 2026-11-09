import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { khachHangApi } from '../services/api';

export default function KhachHangPage() {
  const [khachHangs, setKhachHangs] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Form edit state
  const [editingKH, setEditingKH] = useState(null);
  const [formData, setFormData] = useState({
    hoTen: '',
    email: '',
    soDienThoai: '',
    diaChi: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Modal delete state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingKH, setDeletingKH] = useState(null);

  const fetchKhachHangs = async (search = '') => {
    try {
      setLoading(true);
      const data = await khachHangApi.getAll(search);
      if (data.success) {
        setKhachHangs(data.khachHangs || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Lỗi khi tải danh sách khách hàng.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchKhachHangs(searchTerm);
  }, [searchTerm]);

  const handleEditClick = (kh) => {
    setEditingKH(kh);
    setFormData({
      hoTen: kh.hoTen || '',
      email: kh.email || '',
      soDienThoai: kh.soDienThoai || '',
      diaChi: kh.diaChi || ''
    });
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingKH(null);
    setFormData({ hoTen: '', email: '', soDienThoai: '', diaChi: '' });
    setFormErrors({});
  };

  const handleFormChange = (e) => {
    const { name, value } = e.target;
    setFormData((prev) => ({ ...prev, [name]: value }));
    if (formErrors[name]) {
      setFormErrors((prev) => ({ ...prev, [name]: null }));
    }
  };

  const handleFormSubmit = async (e) => {
    e.preventDefault();
    const errors = {};
    if (!formData.hoTen.trim()) errors.hoTen = 'Họ tên không được để trống';
    if (!formData.email.trim()) errors.email = 'Email không được để trống';
    if (!formData.soDienThoai.trim()) errors.soDienThoai = 'Số điện thoại không được để trống';

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      const res = await khachHangApi.update(editingKH._id, formData);
      if (res.success) {
        setAlert({ type: 'success', message: 'Cập nhật thông tin khách hàng thành công.' });
        handleCancelEdit();
        fetchKhachHangs(searchTerm);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Lỗi khi cập nhật khách hàng.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (kh) => {
    setDeletingKH(kh);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingKH) return;
    try {
      const res = await khachHangApi.delete(deletingKH._id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message || 'Đã xóa khách hàng thành công.' });
        setDeleteModalOpen(false);
        setDeletingKH(null);
        if (editingKH?._id === deletingKH._id) {
          handleCancelEdit();
        }
        fetchKhachHangs(searchTerm);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Không thể xóa khách hàng.' });
      setDeleteModalOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="page-title-row">
        <h1 className="page-title">Quản lý Khách hàng</h1>
      </div>

      {alert && (
        <div className={`alert-banner ${alert.type}`}>
          <span>{alert.message}</span>
          <button
            type="button"
            onClick={() => setAlert(null)}
            style={{ background: 'none', border: 'none', cursor: 'pointer', fontWeight: 'bold' }}
          >
            ✕
          </button>
        </div>
      )}

      <div className="filter-toolbar">
        <div className="search-box">
          <input
            type="text"
            className="search-input"
            placeholder="Tìm kiếm theo tên, email, tên đăng nhập..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="total-count-badge">
          Tổng số: <strong>{totalCount}</strong> khách hàng
        </div>
      </div>

      <div className="content-grid-layout">
        <div className="table-container-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ KH</th>
                <th>HỌ TÊN</th>
                <th>TÊN ĐĂNG NHẬP</th>
                <th>EMAIL</th>
                <th>SỐ ĐIỆN THOẠI</th>
                <th>NGÀY THAM GIA</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px' }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : khachHangs.length === 0 ? (
                <tr>
                  <td colSpan="7" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Không có khách hàng nào phù hợp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                khachHangs.map((kh) => (
                  <tr key={kh._id}>
                    <td className="font-code">{kh.maKH}</td>
                    <td>{kh.hoTen}</td>
                    <td>{kh.username}</td>
                    <td>{kh.email}</td>
                    <td>{kh.soDienThoai}</td>
                    <td>{kh.ngayThamGia}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleEditClick(kh)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => handleDeleteClick(kh)}
                      >
                        Xóa
                      </button>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>

        {editingKH && (
          <div className="side-form-panel">
            <h3 className="side-form-title">Chỉnh sửa khách hàng</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Mã khách hàng</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingKH.maKH}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tên đăng nhập</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingKH.username}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Họ và tên *</label>
                <input
                  type="text"
                  name="hoTen"
                  className={`form-control ${formErrors.hoTen ? 'is-invalid' : ''}`}
                  value={formData.hoTen}
                  onChange={handleFormChange}
                />
                {formErrors.hoTen && <span className="error-feedback">{formErrors.hoTen}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Email *</label>
                <input
                  type="email"
                  name="email"
                  className={`form-control ${formErrors.email ? 'is-invalid' : ''}`}
                  value={formData.email}
                  onChange={handleFormChange}
                />
                {formErrors.email && <span className="error-feedback">{formErrors.email}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Số điện thoại *</label>
                <input
                  type="text"
                  name="soDienThoai"
                  className={`form-control ${formErrors.soDienThoai ? 'is-invalid' : ''}`}
                  value={formData.soDienThoai}
                  onChange={handleFormChange}
                />
                {formErrors.soDienThoai && <span className="error-feedback">{formErrors.soDienThoai}</span>}
              </div>

              <div className="form-group">
                <label className="form-label">Địa chỉ</label>
                <textarea
                  name="diaChi"
                  className="form-control"
                  rows="3"
                  value={formData.diaChi}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting ? 'Đang lưu...' : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleCancelEdit}
                >
                  Hủy
                </button>
              </div>
            </form>
          </div>
        )}
      </div>

      <DeleteConfirmModal
        isOpen={deleteModalOpen}
        title="Xác nhận xóa tài khoản"
        message={`Bạn có chắc chắn muốn xóa tài khoản khách hàng "${deletingKH?.hoTen}" không? Thao tác này không thể hoàn tác.`}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  );
}
