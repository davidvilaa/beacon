"use client";

interface CardGradientBorderProps {
  className?: string;
  roundedClassName?: string;
}

export default function CardGradientBorder({
  className = "",
  roundedClassName = "rounded-sm",
}: CardGradientBorderProps) {
  return (
    <div
      aria-hidden="true"
      className={`pointer-events-none absolute inset-0 ${roundedClassName} border border-transparent opacity-0 transition-opacity duration-200 group-hover:opacity-100 z-10 ${className}`}
      style={{
        background:
          "linear-gradient(to top left, rgba(168, 218, 220, 0.95) 0%, rgba(168, 218, 220, 0.4) 35%, transparent 70%) border-box",
        WebkitMask:
          "linear-gradient(#fff 0 0) padding-box, linear-gradient(#fff 0 0)",
        WebkitMaskComposite: "xor",
        maskComposite: "exclude",
      }}
    />
  );
}
