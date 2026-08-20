import { useThemeStore } from '../../stores/themeStore';

export default function DarkModeToggle() {
  const { isDark, toggle } = useThemeStore();

  return (
    <button
      onClick={toggle}
      className="relative w-10 h-10 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-all duration-200"
      title={isDark ? 'Mode clair' : 'Mode sombre'}
    >
      <span
        className={`material-symbols-outlined text-xl transition-all duration-300 ${
          isDark ? 'text-yellow-400 rotate-0' : 'text-gray-500 rotate-0'
        }`}
      >
        {isDark ? 'light_mode' : 'dark_mode'}
      </span>
    </button>
  );
}
