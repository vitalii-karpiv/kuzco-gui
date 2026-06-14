import { Boxes } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function StockPage() {
  return (
    <PlaceholderPage
      title="Склад"
      route="/admin/stock"
      description="Запчастини й комплектація: список із фільтрами, прив'язка до ноутбуків і потік бронювання."
      icon={Boxes}
    />
  );
}
