import React from "react";
import { Loader2, CheckCircle2, XCircle } from "lucide-react";

interface Props {
  saving: boolean;
  saved: boolean;
  error: boolean;
}

export function SaveIndicator({ saving, saved, error }: Props) {
  if (saving) return (
    <span className="inline-flex items-center gap-1 text-xs text-muted-foreground">
      <Loader2 className="h-3 w-3 animate-spin" /> Saving...
    </span>
  );
  if (saved) return (
    <span className="inline-flex items-center gap-1 text-xs text-green-600 dark:text-green-400 animate-in fade-in">
      <CheckCircle2 className="h-3 w-3" /> Saved
    </span>
  );
  if (error) return (
    <span className="inline-flex items-center gap-1 text-xs text-red-500">
      <XCircle className="h-3 w-3" /> Failed to save
    </span>
  );
  return null;
}
