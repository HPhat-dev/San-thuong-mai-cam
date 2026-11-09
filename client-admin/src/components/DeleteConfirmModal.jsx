import React from 'react';

export default function DeleteConfirmModal({
  isOpen,
  title = 'Xác nhận xóa',
  message = 'Bạn có chắc chắn muốn thực hiện thao tác xóa này không? Hành động này không thể hoàn tác.',
  onClose,
  onConfirm,
  confirmText = 'Xác nhận xóa'
}) {
  if (!isOpen) return null;

  return (
    <div className="modal-overlay" onClick={onClose}>
      <div className="modal-card" onClick={(e) => e.stopPropagation()}>
        <div className="modal-icon-circle">
          <span>!</span>
        </div>
        <h3 className="modal-title">{title}</h3>
        <p className="modal-message">{message}</p>
        <div className="modal-actions">
          <button type="button" className="btn-modal-cancel" onClick={onClose}>
            Hủy
          </button>
          <button
            type="button"
            className="btn-modal-confirm"
            onClick={onConfirm}
          >
            {confirmText}
          </button>
        </div>
      </div>
    </div>
  );
}
