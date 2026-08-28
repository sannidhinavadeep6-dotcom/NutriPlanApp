/* localStorage with in-memory fallback (restricted previews) */

const MEM: Record<string, string> = {};

function backend(): Storage {
  try {
    const t = '__pp_t__';
    window.localStorage.setItem(t, '1');
    window.localStorage.removeItem(t);
    return window.localStorage;
  } catch {
    return {
      length: 0,
      clear: () => Object.keys(MEM).forEach(k => delete MEM[k]),
      getItem: (k: string) => (k in MEM ? MEM[k] : null),
      key: () => null,
      removeItem: (k: string) => delete MEM[k],
      setItem: (k: string, v: string) => { MEM[k] = String(v); },
    } as unknown as Storage;
  }
}

export const storage = {
  ok: (() => {
    try {
      const t = '__pp_t2__';
      window.localStorage.setItem(t, '1');
      window.localStorage.removeItem(t);
      return true;
    } catch { return false; }
  })(),
  get(key: string): string | null { return backend().getItem(key); },
  set(key: string, value: string) { backend().setItem(key, value); },
  remove(key: string) { backend().removeItem(key); },
};
