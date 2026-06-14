import { LaptopMinimal } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function LaptopsPage() {
  return (
    <PlaceholderPage
      title="Ноутбуки"
      route="/admin/laptops"
      description="Життєвий цикл інвентаря: список, дошка-конвеєр за станами, характеристики й тех-перевірка."
      icon={LaptopMinimal}
    />
  );
}
