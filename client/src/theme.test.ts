import { afterEach, beforeEach, describe, expect, it, vi } from "vitest";
import { act, renderHook } from "@testing-library/react";
import { useTheme } from "./theme";

function mockMatchMedia(matchesDark: boolean) {
  const listeners = new Set<() => void>();
  const mql = {
    matches: matchesDark,
    media: "(prefers-color-scheme: dark)",
    addEventListener: (_event: string, listener: () => void) => listeners.add(listener),
    removeEventListener: (_event: string, listener: () => void) => listeners.delete(listener),
  };
  window.matchMedia = vi.fn().mockReturnValue(mql) as unknown as typeof window.matchMedia;
  return {
    triggerChange: (nextMatches: boolean) => {
      mql.matches = nextMatches;
      listeners.forEach((listener) => listener());
    },
  };
}

describe("useTheme", () => {
  beforeEach(() => {
    localStorage.clear();
    document.documentElement.removeAttribute("data-theme");
  });

  afterEach(() => {
    vi.restoreAllMocks();
  });

  it("defaults to the system preference when nothing is stored (dark)", () => {
    mockMatchMedia(true);
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("dark");
    expect(document.documentElement.getAttribute("data-theme")).toBe("dark");
  });

  it("defaults to the system preference when nothing is stored (light)", () => {
    mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("light");
    expect(document.documentElement.getAttribute("data-theme")).toBe("light");
  });

  it("persists an explicit choice and keeps it on a fresh hook instance", () => {
    mockMatchMedia(false);
    const first = renderHook(() => useTheme());
    act(() => first.result.current[1]("dark"));
    expect(localStorage.getItem("theme")).toBe("dark");
    first.unmount();

    // A brand new instance should read the stored choice, not the (light) system preference.
    const second = renderHook(() => useTheme());
    expect(second.result.current[0]).toBe("dark");
  });

  it("stops reacting to OS preference changes after a manual override", () => {
    const { triggerChange } = mockMatchMedia(false);
    const { result } = renderHook(() => useTheme());
    expect(result.current[0]).toBe("light");

    act(() => result.current[1]("dark"));
    expect(result.current[0]).toBe("dark");

    // Simulate the OS switching back to light — the manual override should win.
    act(() => triggerChange(true));
    expect(result.current[0]).toBe("dark");
  });
});
