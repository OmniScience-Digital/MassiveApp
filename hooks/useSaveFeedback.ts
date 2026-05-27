import { useState, useCallback } from "react";

export function useSaveFeedback() {
  const [saving, setSaving] = useState(false);
  const [saved, setSaved] = useState(false);
  const [error, setError] = useState(false);

  const wrap = useCallback(async (fn: () => Promise<void>) => {
    setSaving(true);
    setSaved(false);
    setError(false);
    try {
      await fn();
      setSaved(true);
      setTimeout(() => setSaved(false), 2000);
    } catch {
      setError(true);
      setTimeout(() => setError(false), 3000);
    } finally {
      setSaving(false);
    }
  }, []);

  return { saving, saved, error, wrap };
}
