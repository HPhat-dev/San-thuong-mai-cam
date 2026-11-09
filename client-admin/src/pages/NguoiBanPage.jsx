import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { nguoiBanApi } from '../services/api';

export default function NguoiBanPage() {
  const [nguoiBans, setNguoiBans] = useState([]);
  const [totalCount, setTotalCount] = useState(0);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Form edit state
  const [editingNB, setEditingNB] = useState(null);
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
  const [deletingNB, setDeletingNB] = useState(null);

  const fetchNguoiBans = async (search = '') => {
    try {
      setLoading(true);
      const data = await nguoiBanApi.getAll(search);
      if (data.success) {
        setNguoiBans(data.nguoiBans || []);
        setTotalCount(data.totalCount || 0);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Lỗi khi tải danh sách người bán.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchNguoiBans(searchTerm);
  }, [searchTerm]);

  const handleEditClick = (nb) => {
    setEditingNB(nb);
    setFormData({
      hoTen: nb.hoTen || '',
      email: nb.email || '',
      soDienThoai: nb.soDienThoai || '',
      diaChi: nb.diaChi || ''
    });
    setFormErrors({});
  };

  const handleCancelEdit = () => {
    setEditingNB(null);
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
      const res = await nguoiBanApi.update(editingNB._id, formData);
      if (res.success) {
        setAlert({ type: 'success', message: 'Cập nhật thông tin người bán thành công.' });
        handleCancelEdit();
        fetchNguoiBans(searchTerm);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Lỗi khi cập nhật người bán.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (nb) => {
    setDeletingNB(nb);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingNB) return;
    try {
      const res = await nguoiBanApi.delete(deletingNB._id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message || 'Đã xóa người bán thành công.' });
        setDeleteModalOpen(false);
        setDeletingNB(null);
        if (editingNB?._id === deletingNB._id) {
          handleCancelEdit();
        }
        fetchNguoiBans(searchTerm);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Không thể xóa người bán.' });
      setDeleteModalOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="page-title-row">
        <h1 className="page-title">Quản lý Người bán</h1>
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
            placeholder="Tìm kiếm theo tên, email, tên gian hàng..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <div className="total-count-badge">
          Tổng số: <strong>{totalCount}</strong> người bán
        </div>
      </div>

      <div className="content-grid-layout">
        <div className="table-container-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ NB</th>
                <th>HỌ TÊN</th>
                <th>TÊN GIAN HÀNG</th>
                <th>EMAIL</th>
                <th>SỐ ĐIỆN THOẠI</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px' }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : nguoiBans.length === 0 ? (
                <tr>
                  <td colSpan="6" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Không có người bán nào phù hợp với tìm kiếm.
                  </td>
                </tr>
              ) : (
                nguoiBans.map((nb) => (
                  <tr key={nb._id}>
                    <td className="font-code">{nb.maNB}</td>
                    <td>{nb.hoTen}</td>
                    <td style={{ fontWeight: 600, color: '#4338ca' }}>{nb.tenGianHang}</td>
                    <td>{nb.email}</td>
                    <td>{nb.soDienThoai}</td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleEditClick(nb)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => handleDeleteClick(nb)}
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

        {editingNB && (
          <div className="side-form-panel">
            <h3 className="side-form-title">Chỉnh sửa người bán</h3>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Mã người bán</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingNB.maNB}
                  disabled
                  style={{ backgroundColor: '#f1f5f9', cursor: 'not-allowed' }}
                />
              </div>

              <div className="form-group">
                <label className="form-label">Tên gian hàng</label>
                <input
                  type="text"
                  className="form-control"
                  value={editingNB.tenGianHang}
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
        message={`Bạn có chắc chắn muốn xóa tài khoản người bán "${deletingNB?.hoTen}" không? Thao tác này không thể hoàn tác.`}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  );
}
