import { RuntimesAudit } from "@/types/runtime";

export function getDatesBetween(start: string, end: string): string[] {
  const dates: string[] = [];
  let current = new Date(start);
  const endDate = new Date(end);

  while (current <= endDate) {
    dates.push(current.toISOString().split("T")[0]); // format YYYY-MM-DD
    current.setDate(current.getDate() + 1);
  }

  return dates;
}

export const normalize = (id: string): string => id.replace(/[-_]/g, "");

/**
 * Finds the stored key (input / purple values) that belongs to a scale label.
 * An exact match (ignoring - and _) wins; otherwise any alias is tried. Aliases cover values
 * saved before PLC labels carried the scale name and ICCID (see buildScaleLabel).
 */
export const findSavedKey = (
  keys: string[],
  label: string,
  aliases: string[] = [],
): string | undefined => {
  const target = normalize(label);
  const exact = keys.find((key) => normalize(key) === target);
  if (exact) return exact;
  if (aliases.length === 0) return undefined;
  const alt = aliases.map(normalize);
  return keys.find((key) => alt.includes(normalize(key)));
};

export const hasValidDate = (
  dayData: RuntimesAudit,
): dayData is RuntimesAudit & { date: string } => {
  return dayData.date !== null;
};