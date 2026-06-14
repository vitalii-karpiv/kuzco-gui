import { Layers } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function LaptopGroupsPage() {
  return (
    <PlaceholderPage
      title="Групи"
      route="/admin/laptop-groups"
      description="Каталог і публікація: групи з варіантами, опис для маркетплейсу та статус публікації в Instagram."
      icon={Layers}
    />
  );
}
