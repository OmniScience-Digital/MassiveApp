import { ReportItem } from "@/types/schema";

export type Formula = ReportItem["formulas"][0];

/**
 * Which report sections a formula is printed in. Mirrors the backend rules in
 * OmniscienceBackendServer/src/helper/formulas/formulaPlacement.ts - keep both in sync.
 *
 * Formulas saved before the flags existed have them unset: hourly then defaults to
 * "Yield" only, progressive defaults to on. An explicit flag always wins.
 * Virtual formulas are helper variables and are never printed anywhere.
 */
export const isShownInHourly = (f: Formula): boolean => {
  if (f.virtualformula) return false;
  return (
    f.showInHourly ??
    f.formulaname.replace(/\s+/g, "").toLowerCase() === "yield"
  );
};

export const isShownInProgressive = (f: Formula): boolean => {
  if (f.virtualformula) return false;
  return f.showInProgressive !== false;
};