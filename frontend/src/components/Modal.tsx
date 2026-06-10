import React from 'react';
import { X } from 'lucide-react';

interface ModalProps {
  open: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
  size?: 'sm' | 'md' | 'lg';
}

const sizeClasses: Record<string, string> = {
  sm: 'max-w-sm',
  md: 'max-w-md',
  lg: 'max-w-lg',
};

const Modal: React.FC<ModalProps> = ({ open, onClose, title, children, size = 'md' }) => {
  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4 animate-fade-in">
      <div className="absolute inset-0 bg-black/40 backdrop-blur-sm" onClick={onClose} />
      <div className={`relative bg-surface-container-lowest rounded-2xl border border-outline-variant/20 shadow-2xl ${sizeClasses[size]} w-full animate-slide-up p-6`}>
        <div className="flex items-center justify-between mb-4">
          {title && <h3 className="text-lg font-bold text-on-surface">{title}</h3>}
          <button
            onClick={onClose}
            className="ml-auto p-1.5 hover:bg-surface-container-highest rounded-xl transition-colors text-outline hover:text-on-surface"
            aria-label="Fechar"
          >
            <X size={20} />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
};

export default Modal;
