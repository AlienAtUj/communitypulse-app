import React, { useEffect, useState } from "react";
import { IconClose } from "./icons";

export interface BottomSheetProps {
  isOpen: boolean;
  onClose: () => void;
  title?: string;
  children: React.ReactNode;
}

export function BottomSheet({ isOpen, onClose, title = "Dialog", children }: BottomSheetProps) {
  const [entered, setEntered] = useState(false);

  useEffect(() => {
    if (isOpen) {
      const id = window.requestAnimationFrame(() => {
        setEntered(true);
      });
      return () => window.cancelAnimationFrame(id);
    } else {
      setEntered(false);
    }
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div
      role="dialog"
      aria-modal="true"
      aria-label={title}
      className="fixed inset-0 z-50 flex flex-col justify-end"
    >
      {/* Backdrop */}
      <div
        onClick={onClose}
        className="fixed inset-0 bg-[#111827]/40 transition-opacity duration-200"
        aria-hidden="true"
      />

      {/* Panel */}
      <div
        className={[
          "relative mx-auto w-full max-w-[420px] bg-[#FFFFFF] rounded-t-3xl max-h-[90vh] overflow-y-auto px-5 pt-4 pb-8 transition-transform duration-250 ease-out z-10",
          entered ? "translate-y-0" : "translate-y-full",
        ].join(" ")}
      >
        <div className="relative flex items-center justify-center mb-4">
          {/* Drag handle */}
          <div className="w-[40px] h-[4px] rounded-full bg-[#E5E7EB]" />

          {/* Close button top right */}
          <button
            type="button"
            onClick={onClose}
            aria-label="Close panel"
            className="absolute right-0 -top-2 w-[48px] h-[48px] flex items-center justify-center rounded-full text-[#6B7280] active:scale-[0.98] transition-transform duration-100 cursor-pointer focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5] focus-visible:outline-offset-2"
          >
            <IconClose size={20} />
          </button>
        </div>

        {children}
      </div>
    </div>
  );
}
