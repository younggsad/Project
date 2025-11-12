"use client";

import { useThemeStore } from "@/store/themeStore";
import { Sun, Moon } from "lucide-react";
import styles from "./ThemeToggle.module.css";

export default function ThemeToggle() {
  const { theme, toggleTheme } = useThemeStore();

  return (
    <button
      className={styles.fab}
      onClick={toggleTheme}
      title="Переключить тему"
    >
      {theme === "light" ? <Sun size={28} /> : <Moon size={28} />}
    </button>
  );
}
