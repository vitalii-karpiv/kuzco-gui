import { Banknote } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function FinancePage() {
  return (
    <PlaceholderPage
      title="Фінанси"
      route="/admin/finance"
      description="Зведений огляд: баланси, P&L за період, витрати та інвестиції зі спільним фільтром дат."
      icon={Banknote}
    />
  );
}
