"use client";

import { useSyncExternalStore } from "react";
import {
  siteCopy,
  themeOptions,
  type ThemeOption,
} from "@/lib/copy/id";

const themeChangeEvent = "moodi-theme-change";

function isThemeOption(value: string | null | undefined): value is ThemeOption {
  return themeOptions.some((theme) => theme === value);
}

function getThemeSnapshot(): ThemeOption {
  const theme = document.documentElement.dataset.theme;
  return isThemeOption(theme) ? theme : "light";
}

function getServerThemeSnapshot(): ThemeOption {
  return "light";
}

function subscribeToTheme(onChange: () => void) {
  function syncTheme() {
    const storedTheme = window.localStorage.getItem("moodi-theme");
    const theme = isThemeOption(storedTheme) ? storedTheme : "light";

    document.documentElement.dataset.theme = theme;
    onChange();
  }

  window.addEventListener(themeChangeEvent, syncTheme);
  window.addEventListener("storage", syncTheme);
  syncTheme();

  return () => {
    window.removeEventListener(themeChangeEvent, syncTheme);
    window.removeEventListener("storage", syncTheme);
  };
}

export function ThemeToggle() {
  const theme = useSyncExternalStore(
    subscribeToTheme,
    getThemeSnapshot,
    getServerThemeSnapshot,
  );
  const themeName = siteCopy.navigation.themeNames[theme];

  function cycleTheme() {
    const currentIndex = themeOptions.indexOf(theme);
    const nextTheme =
      themeOptions[(currentIndex + 1) % themeOptions.length];

    document.documentElement.dataset.theme = nextTheme;
    window.localStorage.setItem("moodi-theme", nextTheme);
    window.dispatchEvent(new Event(themeChangeEvent));
  }

  return (
    <button
      type="button"
      onClick={cycleTheme}
      className="inline-flex min-h-11 items-center gap-2 border-2 border-border px-3 text-sm font-medium hover:bg-muted"
      aria-label={`${siteCopy.navigation.themeLabel}: ${themeName}`}
      title={`${siteCopy.navigation.themeLabel}: ${themeName}`}
    >
      <span aria-hidden="true" className="font-pixelify text-lg">
        ◐
      </span>
      <span className="hidden sm:inline">{themeName}</span>
    </button>
  );
}
