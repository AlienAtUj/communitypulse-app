import React from "react";

export type Variant = "primary" | "secondary" | "danger" | "ghost";
export type Size = "md" | "lg";

export interface ButtonProps extends React.ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  fullWidth?: boolean;
  children: React.ReactNode;
}

export function Button({
  variant = "primary",
  size = "md",
  fullWidth = false,
  className = "",
  disabled = false,
  type = "button",
  children,
  ...props
}: ButtonProps) {
  const variantClasses: Record<Variant, string> = {
    primary: "bg-[#003DA5] text-[#FFFFFF] border-none",
    secondary: "bg-[#FFFFFF] text-[#003DA5] border border-[#003DA5]",
    danger: "bg-[#E4002B] text-[#FFFFFF] border-none",
    ghost: "bg-transparent text-[#111827] border-none",
  };

  const sizeClasses: Record<Size, string> = {
    md: "h-[48px]",
    lg: "h-[56px]",
  };

  return (
    <button
      type={type}
      disabled={disabled}
      className={[
        "inline-flex items-center justify-center rounded-[12px] px-[20px] text-[15px] font-bold leading-none transition-transform duration-100 ease-out active:scale-[0.98] focus-visible:outline focus-visible:outline-2 focus-visible:outline-[#003DA5] focus-visible:outline-offset-2 select-none whitespace-nowrap",
        variantClasses[variant],
        sizeClasses[size],
        fullWidth ? "w-full" : "",
        disabled ? "opacity-40 pointer-events-none" : "cursor-pointer",
        className,
      ]
        .filter(Boolean)
        .join(" ")}
      {...props}
    >
      {children}
    </button>
  );
}
