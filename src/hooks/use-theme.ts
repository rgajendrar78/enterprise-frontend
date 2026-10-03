"use client";

import { useEffect, useSyncExternalStore } from "react";
import { THEME, type ThemePreference } from "@/constants/config";

/** Preference in localStorage, resolved theme on `<html data-theme>` — both outside
 *  React, set before it exists. Reading them beats mirroring into state: no flash. */
const listeners = new Set<() => void>();

const subscribe = (onStoreChange: () => void) => {
  listeners.add(onStoreChange);
  return () => void listeners.delete(onStoreChange);
};

const read = (): ThemePreference =>
  (localStorage.getItem(THEME.STORAGE_KEY) as ThemePreference | null) ?? THEME.SYSTEM;

const readOnServer = (): ThemePreference => THEME.SYSTEM;

function apply(preference: ThemePreference): void {
  const dark =
    preference === THEME.DARK ||
    (preference === THEME.SYSTEM && window.matchMedia("(prefers-color-scheme: dark)").matches);
  document.documentElement.dataset.theme = dark ? THEME.DARK : THEME.LIGHT;
}

function setPreference(next: ThemePreference): void {
  localStorage.setItem(THEME.STORAGE_KEY, next);
  apply(next);
  listeners.forEach((notify) => notify());
}

function toggle(): void {
  const showingDark = document.documentElement.dataset.theme === THEME.DARK;
  setPreference(showingDark ? THEME.LIGHT : THEME.DARK);
}

export function useTheme() {
  const preference = useSyncExternalStore(subscribe, read, readOnServer);

  // Normally the head script did this already; repeating it costs one attribute write
  // and means the hook works without it — in a test, or a layout that forgets it.
  useEffect(() => apply(preference), [preference]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-color-scheme: dark)");
    const onChange = () => {
      if (read() === THEME.SYSTEM) apply(THEME.SYSTEM);
    };
    media.addEventListener("change", onChange);
    return () => media.removeEventListener("change", onChange);
  }, []);

  return { preference, toggle };
}
