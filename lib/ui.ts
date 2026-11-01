// Shared, theme-aware class names so inputs and panels look right in both light and dark mode

// Soft filled field (Toss-style): background tone instead of a hard dark box
export const fieldClass =
  "w-full bg-background border border-border rounded-xl px-4 py-3 text-sm text-foreground placeholder:text-sub focus:outline-none focus:border-primary focus:ring-2 focus:ring-primary/20 transition-colors";

export const secondaryButtonClass =
  "bg-card border border-border text-foreground hover:bg-primary/[0.04] transition-colors spring-active disabled:opacity-40";

export const modalPanelClass =
  "bg-card border border-border rounded-3xl p-6 w-full max-w-sm shadow-2xl";
