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

export const hasValidDate = (
  dayData: RuntimesAudit,
): dayData is RuntimesAudit & { date: string } => {
  return dayData.date !== null;
};
