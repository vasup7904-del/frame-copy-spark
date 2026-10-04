import { useCallback, useSyncExternalStore } from "react";
import { emptyData } from "./defaults";
import { normalizeHeader } from "./header";
import type { AppData } from "./types";

const KEY = "resumeforge.data.v1";

let state: AppData = emptyData();
let loaded = false;
const listeners = new Set<() => void>();

function load(): AppData {
  if (typeof window === "undefined") return emptyData();
  try {
    const raw = window.localStorage.getItem(KEY);
    if (!raw) return emptyData();
    const parsed = JSON.parse(raw) as AppData;
    const base = emptyData();
    const resumes = Array.isArray(parsed.resumes)
      ? parsed.resumes
          .filter((r) => r && typeof r === "object")
          .map((r) => ({ ...r, header: normalizeHeader(r.header) }))
      : [];
    return { ...base, ...parsed, resumes, settings: { ...base.settings, ...parsed.settings } };
  } catch {
    return emptyData();
  }
}

function ensureLoaded() {
  if (!loaded && typeof window !== "undefined") {
    state = load();
    loaded = true;
  }
}

function persist() {
  if (typeof window === "undefined") return;
  try {
    window.localStorage.setItem(KEY, JSON.stringify(state));
  } catch {
    /* storage full or unavailable */
  }
}

function emit() {
  listeners.forEach((l) => l());
}

export function getData(): AppData {
  ensureLoaded();
  return state;
}

export function setData(updater: (d: AppData) => AppData) {
  ensureLoaded();
  state = updater(state);
  persist();
  emit();
}

export function replaceData(next: AppData) {
  state = next;
  persist();
  emit();
}

function subscribe(cb: () => void) {
  ensureLoaded();
  listeners.add(cb);
  return () => listeners.delete(cb);
}

const serverSnapshot = emptyData();

export function useAppData(): AppData {
  return useSyncExternalStore(subscribe, getData, () => serverSnapshot);
}

export function useSelector<T>(select: (d: AppData) => T): T {
  const sel = useCallback(() => select(getData()), [select]);
  return useSyncExternalStore(subscribe, sel, () => select(serverSnapshot));
}

export function exportJson(): string {
  return JSON.stringify(getData(), null, 2);
}

export function clearAll() {
  replaceData(emptyData());
}
