import React from 'react';
import Sidebar from './Sidebar';
import Header from './Header';

export default function AdminLayout({ children }) {
  return (
    <div className="admin-wrapper">
      <Sidebar />
      <div className="admin-main">
        <Header />
        <main className="admin-content-body">
          {children}
        </main>
      </div>
    </div>
  );
}
