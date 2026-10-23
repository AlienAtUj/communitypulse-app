import React, { useId } from "react";

export interface InputProps extends React.InputHTMLAttributes<HTMLInputElement> {
  label?: string;
  error?: string;
}

export function Input({ label, error, className = "", id, ...props }: InputProps) {
  const generatedId = useId();
  const inputId = id || generatedId;

  return (
    <div className="w-full flex flex-col">
      {label && (
        <label
          htmlFor={inputId}
          className="text-[13px] font-medium uppercase tracking-[0.05em] leading-[1.4] text-[#6B7280] mb-2 block"
        >
          {label}
        </label>
      )}
      <input
        id={inputId}
        className={[
          "h-[48px] w-full rounded-[12px] bg-[#F7F8FA] border border-[#E5E7EB] px-[16px] text-[15px] font-normal leading-[1.5] text-[#111827] placeholder:text-[#9CA3AF] focus:outline-none focus:border-[#003DA5] focus:ring-2 focus:ring-[#003DA5]/20 transition-colors",
          error ? "border-[#E4002B]" : "",
          className,
        ]
          .filter(Boolean)
          .join(" ")}
        {...props}
      />
      {error && (
        <span className="text-[12px] font-normal leading-[1.4] text-[#E4002B] mt-1">
          {error}
        </span>
      )}
    </div>
  );
}
