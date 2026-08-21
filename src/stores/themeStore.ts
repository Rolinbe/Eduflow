import { create } from 'zustand';

interface ThemeStore {
  isDark: boolean;
  toggle: () => void;
  setDark: (dark: boolean) => void;
}

export const useThemeStore = create<ThemeStore>((set) => ({
  isDark: localStorage.getItem('edukaflow-dark') === 'true',
  toggle: () =>
    set((state) => {
      const next = !state.isDark;
      localStorage.setItem('edukaflow-dark', String(next));
      if (next) {
        document.documentElement.classList.add('dark');
      } else {
        document.documentElement.classList.remove('dark');
      }
      return { isDark: next };
    }),
  setDark: (dark: boolean) => {
    localStorage.setItem('edukaflow-dark', String(dark));
    if (dark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
    set({ isDark: dark });
  },
}));
