"use client";

import { useEffect } from "react";
import { AlertCircle, CheckCircle, X, Info } from "lucide-react";

interface AlertModalProps {
  isOpen: boolean;
  onClose: () => void;
  title: string;
  message: string;
  type?: "success" | "error" | "warning" | "info";
  confirmText?: string;
  cancelText?: string;
  onConfirm?: () => void;     // Acción al pulsar "Sí"
  onCancel?: () => void;      // Acción al pulsar "No"
  showCancelButton?: boolean; // Si queremos mostrar el botón "No"
}

export default function AlertModal({
  isOpen,
  onClose,
  title,
  message,
  type = "info",
  confirmText = "Aceptar",
  cancelText = "Cancelar",
  onConfirm,
  onCancel,
  showCancelButton = false,
}: AlertModalProps) {
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

  if (!isOpen) return null;

  const config = {
    success: { 
      icon: <CheckCircle className="w-14 h-14 text-green-500" />, 
      button: "bg-green-600 hover:bg-green-500" 
    },
    error: { 
      icon: <AlertCircle className="w-14 h-14 text-red-500" />, 
      button: "bg-red-600 hover:bg-red-500" 
    },
    warning: { 
      icon: <AlertCircle className="w-14 h-14 text-yellow-500" />, 
      button: "bg-yellow-600 hover:bg-yellow-500 text-black" 
    },
    info: { 
      icon: <Info className="w-14 h-14 text-blue-500" />, 
      button: "bg-blue-600 hover:bg-blue-500" 
    },
  };

  const current = config[type];

  return (
    <div className="fixed inset-0 z-[200] flex items-center justify-center bg-black/90 backdrop-blur-2xl p-6">
      <div className="bg-[#0f0f12] border border-white/10 w-full max-w-md rounded-[52px] overflow-hidden shadow-2xl relative">
        
        <div className="pt-12 pb-8 px-10 text-center">
          <div className="mx-auto mb-6 flex justify-center">
            {current.icon}
          </div>
          <h3 className="text-2xl font-black italic uppercase tracking-tighter text-white mb-3">
            {title}
          </h3>
          <p className="text-gray-400 text-[15px] leading-relaxed px-4 whitespace-pre-line">
            {message}
          </p>
        </div>

        <div className="border-t border-white/5 p-6 flex gap-4">
          {showCancelButton && onCancel && (
            <button
              onClick={() => {
                onCancel();
                onClose();
              }}
              className="flex-1 py-5 rounded-[32px] font-black uppercase tracking-[0.5em] text-sm transition-all active:scale-95 border border-white/20 text-white hover:bg-white/5"
            >
              {cancelText}
            </button>
          )}

          <button
            onClick={() => {
              if (onConfirm) onConfirm();
              onClose();
            }}
            className={`flex-1 py-5 rounded-[32px] font-black uppercase tracking-[0.5em] text-sm transition-all active:scale-95 text-white ${current.button}`}
          >
            {confirmText}
          </button>
        </div>

        <button
          onClick={onClose}
          className="absolute top-6 right-6 text-gray-500 hover:text-white transition-colors p-2"
        >
          <X size={26} />
        </button>
      </div>
    </div>
  );
}