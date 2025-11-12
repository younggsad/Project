"use client";

import { useEffect, useState } from "react";
import { useThemeStore } from "@/store/themeStore";

export default function ThemeProvider({ children }: { children: React.ReactNode }) {
  const { setTheme } = useThemeStore();
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    if (typeof window === "undefined") return;

    const stored = localStorage.getItem("theme") as "light" | "dark" | null;
    const prefersDark = window.matchMedia("(prefers-color-scheme: dark)").matches;
    const theme = stored || (prefersDark ? "dark" : "light");

    document.documentElement.classList.remove("light", "dark");
    document.documentElement.classList.add(theme);

    setTheme(theme);
    setMounted(true);
  }, [setTheme]);

  if (!mounted) return null;

  return <>{children}</>;
}
