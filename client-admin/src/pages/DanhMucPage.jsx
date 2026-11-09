import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import DeleteConfirmModal from '../components/DeleteConfirmModal';
import { danhMucApi } from '../services/api';

export default function DanhMucPage() {
  const [danhMucs, setDanhMucs] = useState([]);
  const [searchTerm, setSearchTerm] = useState('');
  const [loading, setLoading] = useState(true);
  const [alert, setAlert] = useState(null);

  // Form panel state: mode 'add' | 'edit' | null
  const [panelMode, setPanelMode] = useState(null);
  const [selectedDM, setSelectedDM] = useState(null);
  const [formData, setFormData] = useState({
    tenDanhMuc: '',
    moTaDanhMuc: ''
  });
  const [formErrors, setFormErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);

  // Delete modal state
  const [deleteModalOpen, setDeleteModalOpen] = useState(false);
  const [deletingDM, setDeletingDM] = useState(null);

  const fetchDanhMucs = async (search = '') => {
    try {
      setLoading(true);
      const data = await danhMucApi.getAll(search);
      if (data.success) {
        setDanhMucs(data.danhMucs || []);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Lỗi khi tải danh sách danh mục.' });
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchDanhMucs(searchTerm);
  }, [searchTerm]);

  const handleOpenAdd = () => {
    setPanelMode('add');
    setSelectedDM(null);
    setFormData({ tenDanhMuc: '', moTaDanhMuc: '' });
    setFormErrors({});
  };

  const handleOpenEdit = (dm) => {
    setPanelMode('edit');
    setSelectedDM(dm);
    setFormData({
      tenDanhMuc: dm.tenDanhMuc || '',
      moTaDanhMuc: dm.moTaDanhMuc || ''
    });
    setFormErrors({});
  };

  const handleClosePanel = () => {
    setPanelMode(null);
    setSelectedDM(null);
    setFormData({ tenDanhMuc: '', moTaDanhMuc: '' });
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
    if (!formData.tenDanhMuc.trim()) {
      errors.tenDanhMuc = 'Tên danh mục không được để trống';
    }

    if (Object.keys(errors).length > 0) {
      setFormErrors(errors);
      return;
    }

    try {
      setSubmitting(true);
      if (panelMode === 'add') {
        const res = await danhMucApi.create(formData);
        if (res.success) {
          setAlert({ type: 'success', message: 'Thêm mới danh mục thành công.' });
          handleClosePanel();
          fetchDanhMucs(searchTerm);
        }
      } else if (panelMode === 'edit') {
        const res = await danhMucApi.update(selectedDM._id, formData);
        if (res.success) {
          setAlert({ type: 'success', message: 'Cập nhật danh mục thành công.' });
          handleClosePanel();
          fetchDanhMucs(searchTerm);
        }
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Lỗi xử lý danh mục.' });
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteClick = (dm) => {
    setDeletingDM(dm);
    setDeleteModalOpen(true);
  };

  const handleConfirmDelete = async () => {
    if (!deletingDM) return;
    try {
      const res = await danhMucApi.delete(deletingDM._id);
      if (res.success) {
        setAlert({ type: 'success', message: res.message || 'Đã xóa danh mục thành công.' });
        setDeleteModalOpen(false);
        setDeletingDM(null);
        if (selectedDM?._id === deletingDM._id) {
          handleClosePanel();
        }
        fetchDanhMucs(searchTerm);
      }
    } catch (err) {
      setAlert({ type: 'danger', message: err.message || 'Không thể xóa danh mục.' });
      setDeleteModalOpen(false);
    }
  };

  return (
    <AdminLayout>
      <div className="page-title-row">
        <h1 className="page-title">Quản lý Danh mục</h1>
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
            placeholder="Tìm kiếm theo tên hoặc mô tả danh mục..."
            value={searchTerm}
            onChange={(e) => setSearchTerm(e.target.value)}
          />
        </div>
        <button
          type="button"
          className="btn-add-category"
          onClick={handleOpenAdd}
        >
          <span>+</span>
          <span>Thêm danh mục</span>
        </button>
      </div>

      <div className="content-grid-layout">
        <div className="table-container-card">
          <table className="data-table">
            <thead>
              <tr>
                <th>MÃ DM</th>
                <th>TÊN DANH MỤC</th>
                <th>MÔ TẢ</th>
                <th>SỐ SẢN PHẨM</th>
                <th>THAO TÁC</th>
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px' }}>
                    Đang tải dữ liệu...
                  </td>
                </tr>
              ) : danhMucs.length === 0 ? (
                <tr>
                  <td colSpan="5" style={{ textAlign: 'center', padding: '30px', color: '#64748b' }}>
                    Không có danh mục nào.
                  </td>
                </tr>
              ) : (
                danhMucs.map((dm, idx) => (
                  <tr key={dm._id}>
                    <td className="font-code">DM{String(idx + 1).padStart(3, '0')}</td>
                    <td style={{ fontWeight: 600 }}>{dm.tenDanhMuc}</td>
                    <td style={{ color: '#64748b' }}>{dm.moTaDanhMuc || '—'}</td>
                    <td>
                      <span style={{ fontWeight: 600 }}>{dm.soSanPham || 0}</span> sản phẩm
                    </td>
                    <td>
                      <button
                        type="button"
                        className="btn-action-edit"
                        onClick={() => handleOpenEdit(dm)}
                      >
                        Sửa
                      </button>
                      <button
                        type="button"
                        className="btn-action-delete"
                        onClick={() => handleDeleteClick(dm)}
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

        {panelMode && (
          <div className="side-form-panel">
            <h3 className="side-form-title">
              {panelMode === 'add' ? 'Thêm danh mục mới' : 'Chỉnh sửa danh mục'}
            </h3>
            <form onSubmit={handleFormSubmit}>
              <div className="form-group">
                <label className="form-label">Tên danh mục *</label>
                <input
                  type="text"
                  name="tenDanhMuc"
                  className={`form-control ${formErrors.tenDanhMuc ? 'is-invalid' : ''}`}
                  placeholder="Nhập tên danh mục..."
                  value={formData.tenDanhMuc}
                  onChange={handleFormChange}
                />
                {formErrors.tenDanhMuc && (
                  <span className="error-feedback">{formErrors.tenDanhMuc}</span>
                )}
              </div>

              <div className="form-group">
                <label className="form-label">Mô tả danh mục</label>
                <textarea
                  name="moTaDanhMuc"
                  className="form-control"
                  rows="4"
                  placeholder="Nhập mô tả ngắn về danh mục..."
                  value={formData.moTaDanhMuc}
                  onChange={handleFormChange}
                />
              </div>

              <div className="form-actions-row">
                <button type="submit" className="btn-save" disabled={submitting}>
                  {submitting
                    ? 'Đang xử lý...'
                    : panelMode === 'add'
                    ? 'Thêm danh mục'
                    : 'Lưu thay đổi'}
                </button>
                <button
                  type="button"
                  className="btn-cancel"
                  onClick={handleClosePanel}
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
        title="Xác nhận xóa danh mục"
        message={`Bạn có chắc chắn muốn xóa danh mục "${deletingDM?.tenDanhMuc}" không? Thao tác này không thể hoàn tác.`}
        onClose={() => setDeleteModalOpen(false)}
        onConfirm={handleConfirmDelete}
      />
    </AdminLayout>
  );
}
