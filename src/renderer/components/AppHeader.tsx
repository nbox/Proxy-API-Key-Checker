import { t, type Locale } from "../lib/i18n";
import logoUrl from "../assets/logo.png";

interface AppHeaderProps {
  locale: Locale;
  theme: "light" | "dark";
  online: boolean;
  appVersion: string;
  onLocaleChange: (locale: Locale) => void;
  onToggleTheme: () => void;
}

export function AppHeader({
  locale,
  theme,
  online,
  appVersion,
  onLocaleChange,
  onToggleTheme,
}: AppHeaderProps) {
  return (
    <header className="mb-8 flex flex-wrap items-center justify-between gap-6">
      <div className="flex items-center gap-3">
        <div className="flex flex-col items-center gap-1">
          <img
            src={logoUrl}
            alt=""
            className="h-[72px] w-[72px] object-cover"
          />
          <span className="text-[10px] font-semibold text-ink-400">
            v{appVersion}
          </span>
        </div>
        <div className="space-y-1">
          <div className="flex flex-wrap items-center gap-3">
            <h1 className="text-3xl font-semibold text-ink-900">
              {t(locale, "appTitle")}
            </h1>
            <a
              href="https://github.com/nbox/API-Key-Health-Checker"
              className="inline-flex items-center gap-1.5 text-sm font-semibold text-ink-500 underline-offset-4 transition hover:text-ink-700 hover:underline"
              target="_blank"
              rel="noreferrer"
            >
              <svg
                aria-hidden="true"
                className="h-4 w-4"
                viewBox="0 0 24 24"
                fill="currentColor"
              >
                <path d="M12 2C6.48 2 2 6.58 2 12.24c0 4.53 2.87 8.38 6.84 9.74.5.1.68-.22.68-.48 0-.24-.01-.88-.01-1.72-2.78.62-3.37-1.37-3.37-1.37-.45-1.18-1.11-1.49-1.11-1.49-.91-.64.07-.63.07-.63 1 .07 1.53 1.05 1.53 1.05.9 1.57 2.36 1.12 2.94.86.09-.67.35-1.12.63-1.38-2.22-.26-4.56-1.14-4.56-5.08 0-1.12.39-2.03 1.03-2.74-.1-.26-.45-1.33.1-2.77 0 0 .84-.28 2.75 1.04A9.2 9.2 0 0 1 12 7.1c.83 0 1.67.12 2.45.34 1.9-1.32 2.74-1.04 2.74-1.04.55 1.44.2 2.51.1 2.77.64.71 1.03 1.62 1.03 2.74 0 3.95-2.34 4.82-4.57 5.08.36.31.68.92.68 1.85 0 1.33-.01 2.4-.01 2.73 0 .27.18.59.69.48A10.1 10.1 0 0 0 22 12.24C22 6.58 17.52 2 12 2z" />
              </svg>
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </div>
      <div className="flex flex-wrap items-center gap-4">
        <div className="flex min-h-11 items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-2">
          <span
            className={`h-2 w-2 rounded-full ${
              online ? "bg-emerald-500" : "bg-rose-500"
            }`}
          ></span>
          <span className="text-xs font-semibold text-ink-500">
            {online ? t(locale, "networkOnline") : t(locale, "networkOffline")}
          </span>
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-2">
          <span className="text-xs font-semibold text-ink-500">
            {t(locale, "theme")}
          </span>
          <button
            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs"
            onClick={onToggleTheme}
          >
            {theme === "light" ? "Light" : "Dark"}
          </button>
        </div>
        <div className="flex min-h-11 items-center gap-2 rounded-full border border-white/50 bg-white/60 px-4 py-2">
          <span className="text-xs font-semibold text-ink-500">
            {t(locale, "language")}
          </span>
          <select
            className="rounded-full border border-ink-200 bg-white px-3 py-1 text-xs"
            value={locale}
            onChange={(event) => onLocaleChange(event.target.value as Locale)}
          >
            <option value="en">EN</option>
            <option value="ru">RU</option>
            <option value="es">ES</option>
          </select>
        </div>
      </div>
    </header>
  );
}
