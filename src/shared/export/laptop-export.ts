import * as XLSX from "xlsx";

import {
  LAPTOP_CONDITION_LABELS,
  LAPTOP_STATE_LABELS,
  PANEL_TYPE_LABELS,
  RESOLUTION_LABELS,
  type Laptop,
  type LaptopCondition,
  type PanelType,
} from "@/shared/domain/laptop";

/** "13.3\" IPS Full HD" — built from the parts that are present. */
function displaySpec(laptop: Laptop): string {
  const c = laptop.characteristics;
  if (!c) return "";
  const parts = [
    c.screenSize ? `${c.screenSize}"` : "",
    c.panelType ? (PANEL_TYPE_LABELS[c.panelType as PanelType] ?? c.panelType) : "",
    c.resolution ? (RESOLUTION_LABELS[c.resolution] ?? c.resolution) : "",
  ];
  return parts.filter(Boolean).join(" ");
}

/**
 * Build an .xlsx from the given laptops and trigger a timestamped download.
 * Column shape ports the old CRM's `LaptopExportHelper`. Browser-only (uses
 * `XLSX.writeFile`); call from a click handler.
 */
export function exportLaptopsToExcel(laptops: Laptop[]): void {
  const rows = laptops.map((laptop) => {
    const c = laptop.characteristics ?? {};
    return {
      "Сервісний тег": laptop.serviceTag ?? laptop.code,
      Назва: laptop.name,
      Стан: LAPTOP_STATE_LABELS[laptop.state] ?? laptop.state,
      Процесор: c.processor ?? "",
      Відеокарта: c.videocard ?? "",
      "RAM, ГБ": c.ram ?? "",
      "SSD, ГБ": c.ssd ?? "",
      Екран: displaySpec(laptop),
      "Батарея, %": c.battery ?? "",
      Стан_корпусу: c.condition
        ? (LAPTOP_CONDITION_LABELS[c.condition as LaptopCondition] ?? c.condition)
        : "",
      Собівартість: laptop.costPrice ?? "",
      Ліміт: laptop.limitPrice ?? "",
      "Ціна продажу": laptop.sellPrice ?? "",
      Нотатка: laptop.note ?? "",
    };
  });

  const worksheet = XLSX.utils.json_to_sheet(rows);
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, "Laptops");

  const stamp = new Date().toISOString().slice(0, 10);
  XLSX.writeFile(workbook, `laptops-${stamp}.xlsx`);
}
