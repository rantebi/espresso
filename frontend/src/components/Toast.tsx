import React, { useEffect } from 'react';
import './Toast.css';

export interface ToastMessage {
  id: string;
  message: string;
  type: 'error' | 'success' | 'info';
}

interface ToastProps {
  toast: ToastMessage;
  onClose: (id: string) => void;
}

const Toast: React.FC<ToastProps> = ({ toast, onClose }) => {
  useEffect(() => {
    const timer = setTimeout(() => {
      onClose(toast.id);
    }, 5000); // Auto-close after 5 seconds

    return () => clearTimeout(timer);
  }, [toast.id, onClose]);

  return (
    <div className={`toast toast-${toast.type}`}>
      <div className="toast-content">
        <span className="toast-message">{toast.message}</span>
        <button
          className="toast-close"
          onClick={() => onClose(toast.id)}
          aria-label="Close"
        >
          ×
        </button>
      </div>
    </div>
  );
};

export default Toast;

