// components/widgets/statusReport/StatusReport.tsx
import { useEffect, useState } from "react";
import { Trash2, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import {
  Card,
  CardContent,
  CardHeader,
  CardDescription,
} from "@/components/ui/card";
import ResponseModal from "../response";
import {
  getStatusReportConfig,
  saveStatusReportConfig,
} from "@/service/statusReport.Service";
import { StatusCheck, StatusCheckType } from "@/types/schema";
import Loading from "@/components/widgets/loading";

interface ThresholdFieldMeta {
  key: string;
  label: string;
  default: number;
}

interface CheckTypeMeta {
  value: StatusCheckType;
  label: string;
  needsScaleField: boolean;
  needsFormula: boolean;
  thresholdFields: ThresholdFieldMeta[];
}

// The fixed catalog of check "kinds". The calculation logic behind each kind
// lives in the backend, but every input a person would want to tune — on/off,
// which scale field it reads, its numbers, its wording — is editable here.
// This config is global: it applies to every site (test + prod) the same
// way, so "which field" is a free-text field name (a convention each site's
// scales are expected to follow), not a picker into one specific site.
const CHECK_TYPES: CheckTypeMeta[] = [
  {
    value: "totalizationLimit",
    label: "Totalization Limit",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [{ key: "limit", label: "Limit (tonnes)", default: 750000 }],
  },
  {
    value: "batteryState",
    label: "Battery State",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [{ key: "minPercent", label: "Minimum battery %", default: 50 }],
  },
  {
    value: "totalizerReset",
    label: "Totalizer Reset",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [],
  },
  {
    value: "monthTonsReset",
    label: "Month Tons Reset",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [],
  },
  {
    value: "modbusUpdateInterval",
    label: "Modbus Update Interval",
    needsScaleField: false,
    needsFormula: false,
    thresholdFields: [
      { key: "maxMinutesGap", label: "Max average gap (minutes)", default: 15 },
    ],
  },
  {
    value: "modbusUpdating",
    label: "Modbus Updating",
    needsScaleField: false,
    needsFormula: false,
    thresholdFields: [
      { key: "lookbackHours", label: "Lookback window (hours)", default: 2 },
    ],
  },
  {
    value: "speedError",
    label: "Speed Error Check",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [
      { key: "deviationPercent", label: "Deviation from average (%)", default: 5 },
    ],
  },
  {
    value: "spikeError",
    label: "Spike Error Check",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [
      { key: "bandLow", label: "Production band low (t/hr)", default: 100 },
      { key: "bandHigh", label: "Production band high (t/hr)", default: 150 },
      { key: "spikePercent", label: "Spike jump (%)", default: 30 },
      { key: "maxConsecutive", label: "Max consecutive datapoints", default: 3 },
      { key: "lowCutoff", label: "Low cutoff (t/hr)", default: 20 },
    ],
  },
  {
    value: "zeroError",
    label: "Zero Error Check",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [
      { key: "cutoffPercent", label: "Cutoff (% of average load)", default: 20 },
      { key: "tolerancePercent", label: "Tolerance (%)", default: 2 },
    ],
  },
  {
    value: "kpiCheck",
    label: "KPI Check",
    needsScaleField: false,
    needsFormula: true,
    thresholdFields: [],
  },
  {
    value: "zeroCalibration",
    label: "Zero Calibration Check",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [],
  },
  {
    value: "spanCalibration",
    label: "Span Calibration Check",
    needsScaleField: true,
    needsFormula: false,
    thresholdFields: [],
  },
];

const getMeta = (checkType: StatusCheckType) =>
  CHECK_TYPES.find((c) => c.value === checkType)!;

// Common scale field names, offered as suggestions in a free-text input
// (via a datalist) rather than a hard picker — sites can use any of the
// fixed scale fields or their own dynamic custom columns (e.g. "load",
// "speed", "zeroCalSetpoint", "spanCalSetpoint"), and this config has no way
// to know one site's exact field list since it's shared by all sites.
const SUGGESTED_FIELDS = [
  "totalizer",
  "monthTons",
  "flow",
  "load",
  "speed",
  "battery",
  "zeroCalSetpoint",
  "spanCalSetpoint",
  "deviceAddress",
];

export const StatusReport = () => {
  const [checks, setChecks] = useState<StatusCheck[]>([]);
  const [loading, setLoading] = useState(true);
  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  useEffect(() => {
    (async () => {
      const loaded = await getStatusReportConfig();
      setChecks(loaded);
      setLoading(false);
    })();
  }, []);

  const handleAddCheck = (checkType: StatusCheckType) => {
    const meta = getMeta(checkType);
    const newCheck: StatusCheck = {
      id: `check_${Date.now()}`,
      checkType,
      label: meta.label,
      enabled: true,
      scaleField: meta.needsScaleField ? "" : undefined,
      formulaName: meta.needsFormula ? "" : undefined,
      thresholds: Object.fromEntries(
        meta.thresholdFields.map((t) => [t.key, t.default]),
      ),
      passLabel: "Normal",
      failLabel: "Flagged",
    };
    setChecks((prev) => [...prev, newCheck]);
    setDirty(true);
  };

  const updateCheck = (checkId: string, patch: Partial<StatusCheck>) => {
    setChecks((prev) =>
      prev.map((c) => (c.id === checkId ? { ...c, ...patch } : c)),
    );
    setDirty(true);
  };

  const updateThreshold = (checkId: string, key: string, value: number) => {
    setChecks((prev) =>
      prev.map((c) =>
        c.id === checkId
          ? { ...c, thresholds: { ...c.thresholds, [key]: value } }
          : c,
      ),
    );
    setDirty(true);
  };

  const handleDeleteCheck = (checkId: string) => {
    setChecks((prev) => prev.filter((c) => c.id !== checkId));
    setDirty(true);
  };

  const handleSaveAll = async () => {
    setSaving(true);
    try {
      const result = await saveStatusReportConfig(checks);
      if (result) {
        setDirty(false);
        setSuccessful(true);
        setMessage("Status report criteria saved successfully");
      } else {
        setSuccessful(false);
        setMessage("Failed to save status report criteria");
      }
    } catch {
      setSuccessful(false);
      setMessage("Unexpected error saving status report criteria");
    } finally {
      setSaving(false);
      setShow(true);
    }
  };

  if (loading) {
    return <Loading />;
  }

  return (
    <div className="space-y-4">
      <datalist id="status-report-field-suggestions">
        {SUGGESTED_FIELDS.map((f) => (
          <option key={f} value={f} />
        ))}
      </datalist>

      <div className="flex items-center justify-between flex-wrap gap-2">
        <div className="flex items-center gap-2">
          {dirty && (
            <span className="text-xs text-amber-500">Unsaved changes</span>
          )}
        </div>
        <div className="flex items-center gap-2">
          <Select onValueChange={(v) => handleAddCheck(v as StatusCheckType)}>
            <SelectTrigger className="w-56">
              <SelectValue placeholder="+ Add Check" />
            </SelectTrigger>
            <SelectContent>
              {CHECK_TYPES.map((c) => (
                <SelectItem key={c.value} value={c.value}>
                  {c.label}
                </SelectItem>
              ))}
            </SelectContent>
          </Select>
          <Button onClick={handleSaveAll} disabled={saving || !dirty}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save All
              </>
            )}
          </Button>
        </div>
      </div>

      {checks.length === 0 && (
        <p className="text-sm text-muted-foreground py-6 text-center border rounded-md">
          No checks configured yet — use <strong>+ Add Check</strong> above
          to build the status report criteria that will run across every
          site.
        </p>
      )}

      <div className="space-y-3">
        {checks.map((check) => {
          const meta = getMeta(check.checkType);
          return (
            <Card key={check.id}>
              <CardHeader className="pb-2">
                <div className="flex items-center justify-between gap-4">
                  <div className="flex items-center gap-3 flex-1">
                    <Switch
                      checked={check.enabled}
                      onCheckedChange={(v) =>
                        updateCheck(check.id, { enabled: v })
                      }
                    />
                    <Input
                      value={check.label}
                      onChange={(e) =>
                        updateCheck(check.id, { label: e.target.value })
                      }
                      className="max-w-xs font-medium"
                    />
                    <CardDescription className="whitespace-nowrap">
                      {meta.label}
                    </CardDescription>
                  </div>
                  <button
                    type="button"
                    onClick={() => handleDeleteCheck(check.id)}
                    className="text-muted-foreground hover:text-red-500"
                    title="Remove check"
                  >
                    <Trash2 className="h-4 w-4" />
                  </button>
                </div>
              </CardHeader>
              <CardContent className="flex flex-wrap gap-4 items-end">
                {meta.needsScaleField && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Reads scale field
                    </label>
                    <Input
                      list="status-report-field-suggestions"
                      value={check.scaleField ?? ""}
                      onChange={(e) =>
                        updateCheck(check.id, { scaleField: e.target.value })
                      }
                      placeholder="e.g. flow"
                      className="w-48"
                    />
                  </div>
                )}

                {meta.needsFormula && (
                  <div className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      Formula name (uses its Min/Max KPI)
                    </label>
                    <Input
                      value={check.formulaName ?? ""}
                      onChange={(e) =>
                        updateCheck(check.id, { formulaName: e.target.value })
                      }
                      placeholder="matches a Formula name on each site"
                      className="w-64"
                    />
                  </div>
                )}

                {meta.thresholdFields.map((t) => (
                  <div key={t.key} className="space-y-1">
                    <label className="text-xs text-muted-foreground">
                      {t.label}
                    </label>
                    <Input
                      type="number"
                      className="w-36"
                      value={check.thresholds?.[t.key] ?? t.default}
                      onChange={(e) =>
                        updateThreshold(
                          check.id,
                          t.key,
                          Number(e.target.value),
                        )
                      }
                    />
                  </div>
                ))}

                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Pass wording
                  </label>
                  <Input
                    className="w-32"
                    value={check.passLabel ?? ""}
                    onChange={(e) =>
                      updateCheck(check.id, { passLabel: e.target.value })
                    }
                  />
                </div>
                <div className="space-y-1">
                  <label className="text-xs text-muted-foreground">
                    Fail wording
                  </label>
                  <Input
                    className="w-32"
                    value={check.failLabel ?? ""}
                    onChange={(e) =>
                      updateCheck(check.id, { failLabel: e.target.value })
                    }
                  />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {show && (
        <ResponseModal
          successful={successful}
          message={message}
          setShow={setShow}
        />
      )}
    </div>
  );
};

export default StatusReport;