import { UserCog } from "lucide-react";

import { PlaceholderPage } from "../_components/placeholder-page";

export default function UsersPage() {
  return (
    <PlaceholderPage
      title="Користувачі"
      route="/admin/users"
      description="Персонал: список, створення та редагування облікових записів, що живлять вибір виконавця."
      icon={UserCog}
    />
  );
}
