import React from 'react';

export default function LogoutModal({ isOpen, onClose, onConfirm }) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-circle modal-icon-warning">
          <span>?</span>
        </div>
        <h3 className="modal-title">Xác nhận đăng xuất</h3>
        <p className="modal-message">
          Bạn có chắc chắn muốn đăng xuất khỏi hệ thống Quản trị viên Sàn Online không?
        </p>
        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="btn-modal-confirm btn-modal-primary"
            onClick={onConfirm}
          >
            Đăng xuất
          </button>
        </div>
      </div>
    </div>
  );
}
