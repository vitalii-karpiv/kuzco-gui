import { Package } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function OrdersPage() {
  return (
    <PlaceholderPage
      title="Замовлення"
      route="/admin/orders"
      description="Закупівлі: список із фільтрами, картка замовлення, історія станів і пов'язані ноутбуки."
      icon={Package}
    />
  );
}
