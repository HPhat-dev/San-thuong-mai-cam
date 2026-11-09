import React from 'react';

export default function Header() {
  const adminUser = JSON.parse(localStorage.getItem('admin_user') || '{}');
  const displayName = adminUser.hoTen || 'Quản trị viên';
  const initial = displayName.charAt(0).toUpperCase() || 'Q';

  return (
    <header className="admin-header">
      <div className="header-user-profile">
        <span className="header-user-name">{displayName}</span>
        <div className="header-avatar" title={displayName}>
          {initial}
        </div>
      </div>
    </header>
  );
}
