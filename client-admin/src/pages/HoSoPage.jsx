import React, { useState, useEffect } from 'react';
import AdminLayout from '../components/AdminLayout';
import { hoSoApi } from '../services/api';

export default function HoSoPage() {
  const [admin, setAdmin] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchHoSo = async () => {
      try {
        const data = await hoSoApi.getProfile();
        if (data.success && data.admin) {
          setAdmin(data.admin);
        } else {
          const cached = JSON.parse(localStorage.getItem('admin_user') || '{}');
          setAdmin(cached);
        }
      } catch (err) {
        const cached = JSON.parse(localStorage.getItem('admin_user') || '{}');
        setAdmin(cached);
      } finally {
        setLoading(false);
      }
    };

    fetchHoSo();
  }, []);

  const displayName = admin?.hoTen || 'Quản trị viên';
  const initial = displayName.charAt(0).toUpperCase() || 'Q';

  return (
    <AdminLayout>
      <div className="page-title-row">
        <h1 className="page-title">Quản lý Hồ sơ</h1>
      </div>

      <div className="profile-card">
        <div className="profile-header-block">
          <div className="profile-avatar-large">
            {initial}
          </div>
          <div className="profile-header-info">
            <h3>{displayName}</h3>
            <span className="profile-role-badge">Quản trị viên</span>
          </div>
        </div>

        {loading ? (
          <p style={{ padding: '20px', textAlign: 'center', color: '#64748b' }}>
            Đang tải thông tin hồ sơ...
          </p>
        ) : (
          <div className="profile-details-list">
            <div className="profile-info-row">
              <span className="profile-info-label">Tên đăng nhập:</span>
              <span className="profile-info-value font-code">{admin?.username || 'admin'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Email:</span>
              <span className="profile-info-value">{admin?.email || 'admin@gmail.com'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Số điện thoại:</span>
              <span className="profile-info-value">{admin?.soDienThoai || '0901234567'}</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Vai trò:</span>
              <span className="profile-info-value">Quản trị viên hệ thống</span>
            </div>
            <div className="profile-info-row">
              <span className="profile-info-label">Trạng thái tài khoản:</span>
              <span className="profile-info-value" style={{ color: '#16a34a' }}>
                ● Đang hoạt động
              </span>
            </div>
          </div>
        )}
      </div>
    </AdminLayout>
  );
}
