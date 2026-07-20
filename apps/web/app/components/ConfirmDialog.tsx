"use client";

import React, { useId } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { X } from "lucide-react";
import { useModalA11y } from "../hooks/useModalA11y";

interface ConfirmDialogProps {
  open: boolean;
  title: string;
  message: string;
  confirmLabel?: string;
  cancelLabel?: string;
  onConfirm: () => void;
  onCancel: () => void;
  danger?: boolean;
  loading?: boolean;
}

export default function ConfirmDialog({
  open,
  title,
  message,
  confirmLabel = "Confirm",
  cancelLabel = "Cancel",
  onConfirm,
  onCancel,
  danger = true,
  loading = false,
}: ConfirmDialogProps) {
  const modalRef = useModalA11y(open, onCancel);
  const titleId = useId();

  return (
    <AnimatePresence>
      {open && (
        <motion.div
          ref={modalRef}
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-ink-950/70"
          onClick={(e) => {
            if (e.target === e.currentTarget) onCancel();
          }}
          role="dialog"
          aria-modal="true"
          aria-labelledby={titleId}
          aria-describedby="confirm-dialog-message"
        >
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: 12 }}
            transition={{ duration: 0.18, ease: "easeOut" }}
            className="w-full max-w-sm bg-ink-900 border border-ink-border rounded-2xl p-8 text-ivory-text shadow-[0_24px_64px_-12px_rgba(0,0,0,0.5)]"
          >
            {/* Header */}
            <div className="flex justify-between items-center mb-4">
              <h2
                id={titleId}
                className={`text-lg font-serif ${danger ? "text-brick" : "text-ivory-text"}`}
              >
                {title}
              </h2>
              <button
                onClick={onCancel}
                disabled={loading}
                className="text-muted-ink hover:text-ivory-text transition-colors disabled:opacity-50"
                aria-label="Close dialog"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Message */}
            <p id="confirm-dialog-message" className="text-xs text-muted-ink mb-6">
              {message}
            </p>

            {/* Actions */}
            <div className="flex gap-3">
              <button
                onClick={onConfirm}
                disabled={loading}
                className={`flex-1 py-2.5 rounded-lg text-sm font-semibold transition-colors active:scale-[0.98] disabled:opacity-60 ${
                  danger
                    ? "bg-brick hover:bg-brick/80 text-white"
                    : "bg-brass hover:bg-brass-hover text-white"
                }`}
              >
                {loading ? `${confirmLabel}…` : confirmLabel}
              </button>
              <button
                onClick={onCancel}
                disabled={loading}
                className="py-2.5 px-5 rounded-lg text-sm font-medium border border-ink-border text-ivory-text hover:bg-ink-800 transition-colors disabled:opacity-50"
              >
                {cancelLabel}
              </button>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
