import React from "react";

export const overlayStyle: React.CSSProperties = {
  background: "rgba(15, 23, 42, 0.52)",
  backdropFilter: "blur(3px)",
};

export const headingStyle: React.CSSProperties = {
  color: "var(--color-foreground)",
};

export const mutedStyle: React.CSSProperties = {
  color: "var(--color-muted-foreground)",
};

export const primaryStyle: React.CSSProperties = {
  color: "var(--color-primary)",
};

export const successStyle: React.CSSProperties = {
  color: "var(--color-success, #16a34a)",
};

export const warningStyle: React.CSSProperties = {
  color: "var(--color-warning, #d97706)",
};

export const dangerStyle: React.CSSProperties = {
  color: "var(--color-destructive, #dc2626)",
};

export const sectionSurfaceStyle: React.CSSProperties = {
  background: "var(--business-surface-subtle)",
  border: "1px solid var(--business-card-border)",
  boxShadow: "0 24px 52px -42px rgba(7, 17, 32, 0.28)",
};

export const getVariantButtonStyle = (
  isActive: boolean,
  isAvailable: boolean,
): React.CSSProperties => {
  if (isActive) {
    return {
      background: "var(--color-primary)",
      borderColor: "var(--color-primary)",
      color: "var(--color-primary-foreground, #ffffff)",
    };
  }

  if (isAvailable) {
    return {
      background: "var(--color-card)",
      borderColor: "var(--color-border)",
      color: "var(--color-foreground)",
    };
  }

  return {
    background: "color-mix(in srgb, var(--color-muted) 60%, transparent)",
    borderColor: "color-mix(in srgb, var(--color-border) 50%, transparent)",
    color: "var(--color-muted-foreground)",
  };
};
