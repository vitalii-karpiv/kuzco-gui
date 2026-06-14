import { ShoppingCart } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function SalesPage() {
  return (
    <PlaceholderPage
      title="Продажі"
      route="/admin/sales"
      description="Список продажів, черга підтвердження заявок зі вітрини та фінансова розбивка по кожному продажу."
      icon={ShoppingCart}
    />
  );
}
