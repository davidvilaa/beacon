import React, { ButtonHTMLAttributes, forwardRef } from "react";

export interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: "primary" | "secondary";
}

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", className = "", children, ...props }, ref) => {
    const baseStyles =
      "font-[family-name:var(--font-geist-sans)] text-sm rounded-md transition-all duration-150 inline-flex items-center justify-center cursor-pointer select-none disabled:opacity-50 disabled:cursor-not-allowed active:scale-[0.98]";

    const variantStyles =
      variant === "primary"
        ? "font-semibold px-4 py-2 bg-[#a8dadc] hover:bg-[#8ec5c8] text-zinc-950 shadow-[inset_0_1px_0_rgba(255,255,255,0.4)] active:shadow-none"
        : "font-medium px-4 py-2 bg-zinc-800 text-zinc-300 hover:bg-[#a8dadc] hover:text-zinc-950 border border-zinc-700 hover:border-transparent";

    return (
      <button
        ref={ref}
        className={`${baseStyles} ${variantStyles} ${className}`}
        {...props}
      >
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";

export const PrimaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => <Button ref={ref} variant="primary" {...props} />
);
PrimaryButton.displayName = "PrimaryButton";

export const SecondaryButton = forwardRef<HTMLButtonElement, Omit<ButtonProps, "variant">>(
  (props, ref) => <Button ref={ref} variant="secondary" {...props} />
);
SecondaryButton.displayName = "SecondaryButton";

export default Button;
