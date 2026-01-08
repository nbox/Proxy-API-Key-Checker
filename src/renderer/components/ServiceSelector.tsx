import type { ServiceId } from "../../shared/types";
import { t, type Locale } from "../lib/i18n";
import { SERVICES } from "../lib/services";

interface ServiceSelectorProps {
  locale: Locale;
  selectedService: ServiceId;
  onSelect: (serviceId: ServiceId) => void;
}

export function ServiceSelector({ locale, selectedService, onSelect }: ServiceSelectorProps) {
  return (
    <section className="mb-8">
      <div className="mb-3 text-sm font-semibold uppercase tracking-wide text-ink-400">
        {t(locale, "serviceLabel")}
      </div>
      <div className="flex flex-wrap gap-3">
        {SERVICES.map((service) => (
          <button
            key={service.id}
            className={`chip rounded-full px-4 py-2 text-sm font-semibold transition ${
              selectedService === service.id
                ? "bg-ink-900 text-white shadow-glow"
                : "bg-white/60 text-ink-500 hover:bg-white/80"
            }`}
            onClick={() => onSelect(service.id)}
          >
            {service.name}
          </button>
        ))}
      </div>
    </section>
  );
}
