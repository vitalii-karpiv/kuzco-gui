import {
  Banknote,
  Boxes,
  Layers,
  LaptopMinimal,
  LayoutDashboard,
  Package,
  ShoppingCart,
  SlidersHorizontal,
  UserCog,
  Users,
  type LucideIcon,
} from "lucide-react";

export interface NavItem {
  /** Stable key + the URL it routes to. */
  href: string;
  /** Ukrainian display label (single source — see requirements §CC-5). */
  label: string;
  icon: LucideIcon;
}

export interface NavGroup {
  /** Uppercase group header (Ukrainian). */
  title: string;
  items: NavItem[];
}

/**
 * The admin navigation model. Labels live here only — feature code reads from
 * this so a future i18n pass never has to touch the screens.
 */
export const NAV_GROUPS: NavGroup[] = [
  {
    title: "Операції",
    items: [
      { href: "/admin/dashboard", label: "Дашборд", icon: LayoutDashboard },
      { href: "/admin/orders", label: "Замовлення", icon: Package },
      { href: "/admin/laptops", label: "Ноутбуки", icon: LaptopMinimal },
      { href: "/admin/laptop-groups", label: "Групи", icon: Layers },
      { href: "/admin/sales", label: "Продажі", icon: ShoppingCart },
    ],
  },
  {
    title: "Дані",
    items: [
      { href: "/admin/customers", label: "Клієнти", icon: Users },
      { href: "/admin/stock", label: "Склад", icon: Boxes },
      { href: "/admin/finance", label: "Фінанси", icon: Banknote },
    ],
  },
  {
    title: "Система",
    items: [
      { href: "/admin/users", label: "Користувачі", icon: UserCog },
      { href: "/admin/system", label: "Система", icon: SlidersHorizontal },
    ],
  },
];
