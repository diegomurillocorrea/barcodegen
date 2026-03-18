"use client";

import React from "react";
import { FiMoon, FiSun } from "react-icons/fi";
import { useTheme } from "@/hooks/useTheme";

export function ThemeToggle() {
  const { theme, toggleTheme } = useTheme();

  const [mounted, setMounted] = React.useState(false);

  React.useEffect(() => {
    setMounted(true);
  }, []);

  // Prevent hydration mismatch by rendering a stable icon/labels until mounted.
  const isDark = mounted ? theme === "dark" : false;

  return (
    <button
      type="button"
      onClick={toggleTheme}
      aria-label={isDark ? "Cambiar a modo claro" : "Cambiar a modo oscuro"}
      title={isDark ? "Modo claro" : "Modo oscuro"}
      className="flex items-center justify-center w-10 h-10 rounded-md border-2 border-(--border) bg-[var(--surface)] text-[var(--text)] hover:bg-(--surface-2) transition-colors duration-200"
    >
      {isDark ? <FiMoon size={18} /> : <FiSun size={18} />}
      <span className="sr-only">{isDark ? "Modo claro" : "Modo oscuro"}</span>
    </button>
  );
}

