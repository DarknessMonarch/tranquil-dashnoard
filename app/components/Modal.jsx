"use client";

import { useEffect } from "react";
import { MdClose } from "react-icons/md";
import styles from "@/app/styles/modal.module.css";
import Button from "./Button";

export default function Modal({
  isOpen,
  onClose,
  title,
  children,
  actions = null,
  size = "medium",
  showCloseButton = true,
  className = "",
  ...props
}) {
  // Prevent body scroll when modal is open
  useEffect(() => {
    if (isOpen) {
      document.body.style.overflow = "hidden";
    } else {
      document.body.style.overflow = "unset";
    }

    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  // Close on Escape key
  useEffect(() => {
    const handleEscape = (e) => {
      if (e.key === "Escape" && isOpen) {
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);
    return () => document.removeEventListener("keydown", handleEscape);
  }, [isOpen, onClose]);

  if (!isOpen) return null;

  return (
    <div className={styles.overlay} onClick={onClose} {...props}>
      <div
        className={`${styles.modal} ${styles[size]} ${className}`}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Modal Header */}
        <div className={styles.header}>
          {title && <h2 className={styles.title}>{title}</h2>}
          {showCloseButton && (
            <button
              onClick={onClose}
              className={styles.closeButton}
              aria-label="Close modal"
            >
              <MdClose size={24} />
            </button>
          )}
        </div>

        {/* Modal Body */}
        <div className={styles.body}>{children}</div>

        {/* Modal Footer (Actions) */}
        {actions && <div className={styles.footer}>{actions}</div>}
      </div>
    </div>
  );
}
