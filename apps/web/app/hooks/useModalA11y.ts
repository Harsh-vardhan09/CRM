import { useEffect, useRef } from "react";

/**
 * Accessibility hook for modals:
 * - Traps focus within modal on mount
 * - Closes on Escape key
 * - Restores focus to trigger element on close
 */
export function useModalA11y(open: boolean, onClose: () => void) {
  const modalRef = useRef<HTMLDivElement>(null);
  const previousActiveElementRef = useRef<HTMLElement | null>(null);

  useEffect(() => {
    if (!open) return;

    // Store the element that had focus before modal opened
    previousActiveElementRef.current = document.activeElement as HTMLElement;

    // Focus first focusable element in modal
    const focusableElements = modalRef.current?.querySelectorAll<HTMLElement>(
      "button, [href], input, select, textarea, [tabindex]:not([tabindex='-1'])"
    );
    if (focusableElements && focusableElements.length > 0) {
      focusableElements[0].focus();
    }

    // Handle Escape key
    const handleEscape = (e: KeyboardEvent) => {
      if (e.key === "Escape") {
        e.preventDefault();
        onClose();
      }
    };

    document.addEventListener("keydown", handleEscape);

    // Trap focus within modal using keydown
    const handleKeyDown = (e: KeyboardEvent) => {
      if (e.key !== "Tab" || !focusableElements) return;

      const firstElement = focusableElements[0];
      const lastElement = focusableElements[focusableElements.length - 1];
      const activeElement = document.activeElement;

      // Shift+Tab on first element → focus last element
      if (e.shiftKey && activeElement === firstElement) {
        e.preventDefault();
        lastElement.focus();
      }

      // Tab on last element → focus first element
      if (!e.shiftKey && activeElement === lastElement) {
        e.preventDefault();
        firstElement.focus();
      }
    };

    modalRef.current?.addEventListener("keydown", handleKeyDown);

    return () => {
      document.removeEventListener("keydown", handleEscape);
      modalRef.current?.removeEventListener("keydown", handleKeyDown);

      // Restore focus to trigger element
      previousActiveElementRef.current?.focus();
    };
  }, [open, onClose]);

  return modalRef;
}
