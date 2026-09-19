import React from 'react';
import { Check, X, AlertCircle } from 'lucide-react';
import { Language } from '../types';

interface ConfirmationModalProps {
  isOpen: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  language?: Language;
  highContrast?: boolean;
  destructive?: boolean;
}

export const ConfirmationModal: React.FC<ConfirmationModalProps> = ({
  isOpen,
  title,
  message,
  confirmLabel,
  cancelLabel,
  onConfirm,
  onCancel,
  language = 'en',
  highContrast = false,
  destructive = false,
}) => {
  if (!isOpen) return null;

  const defaultYes = language === 'hi' ? 'हाँ, पक्का' : language === 'hinglish' ? 'Haan, pakka' : 'Yes, I am sure';
  const defaultNo = language === 'hi' ? 'नहीं, वापस जाएं' : language === 'hinglish' ? 'Nahi, wapas' : 'No, go back';

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-labelledby="confirm-modal-title"
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/60 backdrop-blur-xs"
    >
      <div
        className="w-full max-w-lg rounded-[24px] p-6 sm:p-8 shadow-2xl border transition-all"
        style={{
          backgroundColor: highContrast ? '#111111' : '#FFFFFF',
          borderColor: highContrast ? '#FFFFFF' : '#E4E1F5',
          color: highContrast ? '#FFFFFF' : '#16163A',
        }}
      >
        <div className="flex items-start gap-4 mb-4">
          <div
            className={`w-14 h-14 rounded-2xl flex items-center justify-center shrink-0 ${
              destructive ? 'bg-red-100 text-[#C62828]' : 'bg-indigo-100 text-[#3B3A9E]'
            }`}
          >
            <AlertCircle className="w-8 h-8" />
          </div>
          <div>
            <h3
              id="confirm-modal-title"
              className="text-2xl sm:text-3xl font-bold font-heading tracking-tight"
              style={{ color: highContrast ? '#FFFFFF' : '#16163A' }}
            >
              {title}
            </h3>
            <p
              className="text-lg sm:text-xl font-medium mt-2 leading-relaxed"
              style={{ color: highContrast ? '#E5E7EB' : '#3F3F66' }}
            >
              {message}
            </p>
          </div>
        </div>

        {/* Buttons (minimum 64px tall, 600 weight) */}
        <div className="flex flex-col sm:flex-row gap-3 mt-6">
          <button
            id="btn-confirm-yes"
            onClick={onConfirm}
            className={`flex-1 min-h-[64px] rounded-full font-semibold text-xl flex items-center justify-center gap-3 px-6 shadow-md transition-colors cursor-pointer text-white ${
              destructive
                ? 'bg-[#C62828] hover:bg-[#A81F1F]'
                : 'bg-[#3B3A9E] hover:bg-[#2E2D80]'
            }`}
          >
            <Check className="w-7 h-7" />
            <span>{confirmLabel || defaultYes}</span>
          </button>

          <button
            id="btn-confirm-no"
            onClick={onCancel}
            className="flex-1 min-h-[64px] rounded-full font-semibold text-xl flex items-center justify-center gap-3 px-6 border-2 transition-colors cursor-pointer"
            style={{
              backgroundColor: highContrast ? '#222222' : '#FFFFFF',
              color: highContrast ? '#FFFFFF' : '#3B3A9E',
              borderColor: highContrast ? '#FFFFFF' : '#3B3A9E',
            }}
          >
            <X className="w-7 h-7" />
            <span>{cancelLabel || defaultNo}</span>
          </button>
        </div>
      </div>
    </div>
  );
};
