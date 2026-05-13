const ConfirmationModal = ({ data, onClose }) => {
  const {
    title = "Confirmation",
    message = "Are you sure?",
    confirmText = "Yes",
    cancelText = "No",
    onConfirm = () => {},
    onCancel = () => {},
  } = data || {};

  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const handleCancel = () => {
    onCancel();
    onClose();
  };

  return (
    <div className="confirmation-modal">
      <h3 className="modal-title">{title}</h3>
      <p className="confirmation-modal-message">{message}</p>
      <div className="btn-modal">
        <button className="btn-modal-cancel" onClick={handleCancel}>
          {cancelText}
        </button>
        <button className="btn-modal-confirm" onClick={handleConfirm}>
          {confirmText}
        </button>
      </div>
    </div>
  );
};

export default ConfirmationModal;
