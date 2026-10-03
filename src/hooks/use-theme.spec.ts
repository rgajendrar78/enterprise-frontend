import { act, renderHook } from "@testing-library/react";
import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { THEME } from "@/constants/config";
import { useTheme } from "@/hooks/use-theme";

function givenOsPrefersDark(dark: boolean) {
  vi.stubGlobal("matchMedia", () => ({
    matches: dark,
    addEventListener: vi.fn(),
    removeEventListener: vi.fn(),
  }));
}

const resolved = () => document.documentElement.dataset.theme;

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    delete document.documentElement.dataset.theme;
  });
  afterEach(() => vi.unstubAllGlobals());

  // Also the guarantee that "system" never reaches the attribute: CSS only ever sees
  // light or dark, which is what keeps `globals.css` to a single dark block.
  it("defaults to following the OS", () => {
    givenOsPrefersDark(true);
    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe(THEME.SYSTEM);
    expect(resolved()).toBe(THEME.DARK);
  });

  it("resolves system to light when the OS is light", () => {
    givenOsPrefersDark(false);
    renderHook(() => useTheme());

    expect(resolved()).toBe(THEME.LIGHT);
  });

  // The button offers no menu, so the first click has to commit to something. It flips
  // against what is on screen, not against the stored preference, which is still "system".
  it("toggles from system to the opposite of what the OS resolved to, and remembers it", () => {
    givenOsPrefersDark(true);
    const { result } = renderHook(() => useTheme());
    expect(resolved()).toBe(THEME.DARK);

    act(() => result.current.toggle());

    expect(resolved()).toBe(THEME.LIGHT);
    expect(result.current.preference).toBe(THEME.LIGHT);
    expect(localStorage.getItem(THEME.STORAGE_KEY)).toBe(THEME.LIGHT);
  });

  it("toggles back and forth once a choice has been made", () => {
    givenOsPrefersDark(false);
    const { result } = renderHook(() => useTheme());

    act(() => result.current.toggle());
    expect(resolved()).toBe(THEME.DARK);

    act(() => result.current.toggle());
    expect(resolved()).toBe(THEME.LIGHT);
  });

  it("reads the stored choice on the next visit", () => {
    givenOsPrefersDark(false);
    localStorage.setItem(THEME.STORAGE_KEY, THEME.DARK);

    const { result } = renderHook(() => useTheme());

    expect(result.current.preference).toBe(THEME.DARK);
    expect(resolved()).toBe(THEME.DARK);
  });
});
