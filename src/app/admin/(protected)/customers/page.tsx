import { Users } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function CustomersPage() {
  return (
    <PlaceholderPage
      title="Клієнти"
      route="/admin/customers"
      description="Легкий CRM: картка клієнта (ім'я та телефон) й історія його продажів."
      icon={Users}
    />
  );
}
