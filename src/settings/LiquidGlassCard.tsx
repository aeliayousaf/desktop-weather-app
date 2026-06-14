import type { ReactNode } from "react";

export function LiquidGlassProvider({ children }: { children: ReactNode }) {
  return children;
}

export function LiquidGlassCard({
  children,
  className,
}: {
  children: ReactNode;
  className?: string;
}) {
  return (
    <section className={`liquid-glass-card ${className ?? ""}`.trim()}>
      <div className="liquid-glass-card-content">{children}</div>
    </section>
  );
}
