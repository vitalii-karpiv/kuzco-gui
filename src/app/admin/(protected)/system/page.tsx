import { SlidersHorizontal } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function SystemPage() {
  return (
    <PlaceholderPage
      title="Система"
      route="/admin/system"
      description="Адміністрування: перемикач стану Kuzco (активний ↔ лише читання) та сервісні дії."
      icon={SlidersHorizontal}
    />
  );
}
