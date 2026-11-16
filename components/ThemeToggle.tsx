"use client";

import { MoonIcon, SunIcon } from "./icons";

const THEME_COLORS = { light: "#f6f5f2", dark: "#0c0a09" };

/**
 * Light / dark switch. The icon is chosen by CSS (so there is no flash), the
 * choice is remembered in localStorage, and the phone's browser bar colour follows it.
 */
export function ThemeToggle() {
  function toggle() {
    const root = document.documentElement;
    const next = root.dataset.theme === "dark" ? "light" : "dark";
    root.dataset.theme = next;
    root.style.colorScheme = next;
    try {
      localStorage.setItem("theme", next);
    } catch {
      /* private mode: the choice just isn't remembered */
    }
    document.querySelector('meta[name="theme-color"]')?.setAttribute("content", THEME_COLORS[next]);
  }

  return (
    <button type="button" onClick={toggle} className="icon-btn" aria-label="Switch between light and dark mode" title="Light / dark mode">
      <SunIcon className="hidden dark:block" />
      <MoonIcon className="dark:hidden" />
    </button>
  );
}
