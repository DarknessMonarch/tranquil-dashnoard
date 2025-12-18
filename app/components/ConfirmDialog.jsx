"use client";

import Modal from "./Modal";
import Button from "./Button";
import styles from "@/app/styles/confirmDialog.module.css";

export default function ConfirmDialog({
  isOpen,
  onClose,
  onConfirm,
  title = "Confirm Action",
  message,
  confirmText = "Confirm",
  cancelText = "Cancel",
  variant = "danger",
  ...props
}) {
  const handleConfirm = () => {
    onConfirm();
    onClose();
  };

  const actions = (
    <>
      <Button variant="secondary" onClick={onClose}>
        {cancelText}
      </Button>
      <Button variant={variant} onClick={handleConfirm}>
        {confirmText}
      </Button>
    </>
  );

  return (
    <Modal
      isOpen={isOpen}
      onClose={onClose}
      title={title}
      actions={actions}
      size="small"
      {...props}
    >
      <p className={styles.message}>{message}</p>
    </Modal>
  );
}
