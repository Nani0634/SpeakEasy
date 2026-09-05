import { HTMLAttributes, ReactNode } from "react";

interface CardProps extends HTMLAttributes<HTMLDivElement> {
  children: ReactNode;
  padding?: "none" | "small" | "medium" | "large";
  hover?: boolean;
}

export default function Card({
  children,
  padding = "medium",
  hover = false,
  className = "",
  ...props
}: CardProps) {
  const paddingStyles = {
    none: "p-0",
    small: "p-4",
    medium: "p-6",
    large: "p-8",
  };

  const hoverStyles = hover
    ? "transition-all duration-200 hover:-translate-y-1 hover:shadow-lg hover:border-green-200"
    : "";

  return (
    <div
      className={`rounded-2xl border border-slate-200 bg-white ${paddingStyles[padding]} ${hoverStyles} ${className}`}
      {...props}
    >
      {children}
    </div>
  );
}