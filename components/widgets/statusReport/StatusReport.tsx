// components/widgets/statusReport/StatusReport.tsx
import { useEffect, useState } from "react";
import { ChevronDown, ChevronRight, Save, Loader2 } from "lucide-react";
import { Button } from "@/components/ui/button";
import { Input } from "@/components/ui/input";
import { Switch } from "@/components/ui/switch";
import { Badge } from "@/components/ui/badge";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { Card, CardContent, CardHeader, CardDescription } from "@/components/ui/card";
import ResponseModal from "../response";
import { client } from "@/service/schemaClient";
import {
  getStatusReportConfig,
  saveSiteStatusReportConfig,
} from "@/service/statusReport.Service";
import {
  ReportItem,
  ScaleCheckType,
  StatusCheck,
  KpiCheckConfig,
  SiteStatusReportConfig,
  StatusReportConfig,
} from "@/types/schema";
import Loading from "@/components/widgets/loading";

interface ThresholdFieldMeta {
  key: string;
  label: string;
  default: number;
}

interface CheckTypeMeta {
  value: ScaleCheckType;
  label: string;
  needsScaleField: boolean;
  thresholdFields: ThresholdFieldMeta[];
}

// The fixed catalog of scale-level check kinds. Every scale gets one
// configurable entry per kind — enable/disable per scale is the whole
// point (Totalization Limit can be on for one scale, off for another, on
// the same site).
const CHECK_TYPES: CheckTypeMeta[] = [
  {
    value: "totalizationLimit",
    label: "Totalization Limit",
    needsScaleField: true,
    thresholdFields: [{ key: "limit", label: "Limit (tonnes)", default: 750000 }],
  },
  {
    value: "batteryState",
    label: "Battery State",
    needsScaleField: true,
    thresholdFields: [{ key: "minPercent", label: "Minimum battery %", default: 50 }],
  },
  {
    value: "totalizerReset",
    label: "Totalizer Reset",
    needsScaleField: true,
    thresholdFields: [],
  },
  {
    value: "monthTonsReset",
    label: "Month Tons Reset",
    needsScaleField: true,
    thresholdFields: [],
  },
  {
    value: "modbusUpdateInterval",
    label: "Modbus Update Interval",
    needsScaleField: true,
    thresholdFields: [
      { key: "maxMinutesGap", label: "Max average gap (minutes)", default: 15 },
    ],
  },
  {
    value: "modbusUpdating",
    label: "Modbus Updating",
    needsScaleField: true,
    thresholdFields: [
      { key: "lookbackHours", label: "Lookback window (hours)", default: 2 },
    ],
  },
  {
    value: "speedError",
    label: "Speed Error Check",
    needsScaleField: true,
    thresholdFields: [
      { key: "deviationPercent", label: "Deviation from average (%)", default: 5 },
    ],
  },
  {
    value: "spikeError",
    label: "Spike Error Check",
    needsScaleField: true,
    thresholdFields: [
      { key: "spikePercent", label: "Spike jump (%)", default: 30 },
      { key: "maxConsecutive", label: "Max consecutive datapoints", default: 3 },
    ],
  },
  {
    value: "zeroError",
    label: "Zero Error Check",
    needsScaleField: true,
    thresholdFields: [
      { key: "cutoffPercent", label: "Cutoff (% of average load)", default: 20 },
      { key: "tolerancePercent", label: "Tolerance (%)", default: 2 },
    ],
  },
  {
    value: "zeroCalibration",
    label: "Zero Calibration Check",
    needsScaleField: true,
    thresholdFields: [],
  },
  {
    value: "spanCalibration",
    label: "Span Calibration Check",
    needsScaleField: true,
    thresholdFields: [],
  },
];

const getMeta = (checkType: ScaleCheckType) => CHECK_TYPES.find((c) => c.value === checkType)!;

const FIXED_SCALE_FIELDS = [
  { key: "totalizer", label: "Totalizer" },
  { key: "battery", label: "Battery" },
  { key: "monthTons", label: "Month Tons" },
  { key: "flow", label: "Flow" },
  { key: "openingScaletons", label: "Opening MTD" },
  { key: "zeroCalSetpoint", label: "Zero Cal Setpoint" },
  { key: "spanCalSetpoint", label: "Span Cal Setpoint" },
];

const blankScaleChecks = (): StatusCheck[] =>
  CHECK_TYPES.map((meta) => ({
    checkType: meta.value,
    enabled: false,
    scaleField: "",
    thresholds: Object.fromEntries(meta.thresholdFields.map((t) => [t.key, t.default])),
    passLabel: "Normal",
  }));

type SiteOption = { id: string; siteName: string };

const isSiteConfigured = (config: StatusReportConfig, siteId: string): boolean => {
  const site = config.sites[siteId];
  if (!site) return false;
  if (site.kpiChecks?.some((k) => k.enabled)) return true;
  return Object.values(site.scaleChecks || {}).some((checks) =>
    checks.some((c) => c.enabled),
  );
};

export const StatusReport = () => {
  const [siteOptions, setSiteOptions] = useState<SiteOption[]>([]);
  const [selectedSiteId, setSelectedSiteId] = useState<string>("");
  const [loadingSites, setLoadingSites] = useState(true);
  const [loadingSite, setLoadingSite] = useState(false);

  const [globalConfig, setGlobalConfig] = useState<StatusReportConfig>({ sites: {} });

  const [scales, setScales] = useState<ReportItem["scales"]>([]);
  const [scaleColumns, setScaleColumns] = useState<ReportItem["scaleColumns"]>([]);
  const [formulas, setFormulas] = useState<ReportItem["formulas"]>([]);

  const [kpiChecks, setKpiChecks] = useState<KpiCheckConfig[]>([]);
  const [scaleChecks, setScaleChecks] = useState<{ [iccid: string]: StatusCheck[] }>({});
  const [expanded, setExpanded] = useState<Set<string>>(new Set());

  const [dirty, setDirty] = useState(false);
  const [saving, setSaving] = useState(false);
  const [show, setShow] = useState(false);
  const [successful, setSuccessful] = useState(false);
  const [message, setMessage] = useState("");

  const scaleFieldOptions = [
    ...FIXED_SCALE_FIELDS,
    ...(scaleColumns ?? []).map((c) => ({ key: c.key, label: c.label })),
  ];

  // Load the list of sites once, alphabetical, plus the whole global config
  // up front so the left column can show a "configured" mark per site.
  useEffect(() => {
    setLoadingSites(true);
    const sub = client.models.Sites.observeQuery().subscribe({
      next: (data) => {
        const options = data.items
          .map((r) => {
            const p = typeof r.site === "string" ? JSON.parse(r.site) : r.site;
            return { id: r.id, siteName: p?.siteConstants?.siteName || r.id };
          })
          .sort((a, b) => a.siteName.localeCompare(b.siteName));
        setSiteOptions(options);
        setLoadingSites(false);
      },
      error: () => setLoadingSites(false),
    });
    getStatusReportConfig().then(setGlobalConfig);
    return () => sub.unsubscribe();
  }, []);

  // Load the selected site's scales/formulas plus its existing Status
  // Report config, and fill in defaults for anything not yet configured.
  useEffect(() => {
    if (!selectedSiteId) return;
    setLoadingSite(true);
    (async () => {
      const { data: siteModel } = await client.models.Sites.get({ id: selectedSiteId });
      const parsed =
        typeof siteModel?.site === "string" ? JSON.parse(siteModel.site) : siteModel?.site;

      const siteScales: ReportItem["scales"] = parsed?.scales || [];
      const siteScaleColumns: ReportItem["scaleColumns"] = parsed?.scaleColumns || [];
      const siteFormulas: ReportItem["formulas"] = parsed?.formulas || [];

      setScales(siteScales);
      setScaleColumns(siteScaleColumns);
      setFormulas(siteFormulas);

      const existing: SiteStatusReportConfig | undefined = globalConfig.sites[selectedSiteId];

      const kpiEligible = siteFormulas.filter((f) => f.minKpi || f.maxKpi);
      const nextKpiChecks: KpiCheckConfig[] = kpiEligible.map((f) => {
        const existingKpi = existing?.kpiChecks.find((k) => k.formulaName === f.formulaname);
        return (
          existingKpi || { formulaName: f.formulaname, enabled: false, passLabel: "Normal" }
        );
      });

      const nextScaleChecks: { [iccid: string]: StatusCheck[] } = {};
      for (const scale of siteScales) {
        const savedForScale = existing?.scaleChecks?.[scale.iccid];
        if (savedForScale && savedForScale.length === CHECK_TYPES.length) {
          nextScaleChecks[scale.iccid] = savedForScale;
        } else {
          const defaults = blankScaleChecks();
          nextScaleChecks[scale.iccid] = defaults.map(
            (d) => savedForScale?.find((s) => s.checkType === d.checkType) || d,
          );
        }
      }

      setKpiChecks(nextKpiChecks);
      setScaleChecks(nextScaleChecks);
      setExpanded(new Set());
      setDirty(false);
      setLoadingSite(false);
    })();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [selectedSiteId]);

  const toggleExpanded = (iccid: string) => {
    setExpanded((prev) => {
      const next = new Set(prev);
      if (next.has(iccid)) next.delete(iccid);
      else next.add(iccid);
      return next;
    });
  };

  const updateKpiCheck = (formulaName: string, patch: Partial<KpiCheckConfig>) => {
    setKpiChecks((prev) =>
      prev.map((k) => (k.formulaName === formulaName ? { ...k, ...patch } : k)),
    );
    setDirty(true);
  };

  const updateScaleCheck = (
    iccid: string,
    checkType: ScaleCheckType,
    patch: Partial<StatusCheck>,
  ) => {
    setScaleChecks((prev) => ({
      ...prev,
      [iccid]: (prev[iccid] || []).map((c) =>
        c.checkType === checkType ? { ...c, ...patch } : c,
      ),
    }));
    setDirty(true);
  };

  const updateScaleCheckThreshold = (
    iccid: string,
    checkType: ScaleCheckType,
    key: string,
    value: number,
  ) => {
    setScaleChecks((prev) => ({
      ...prev,
      [iccid]: (prev[iccid] || []).map((c) =>
        c.checkType === checkType
          ? { ...c, thresholds: { ...c.thresholds, [key]: value } }
          : c,
      ),
    }));
    setDirty(true);
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      const siteConfig: SiteStatusReportConfig = { kpiChecks, scaleChecks };
      const result = await saveSiteStatusReportConfig(selectedSiteId, siteConfig);
      if (result) {
        setGlobalConfig(result);
        setDirty(false);
        setSuccessful(true);
        setMessage("Status report configuration saved for this site");
      } else {
        setSuccessful(false);
        setMessage("Failed to save status report configuration");
      }
    } catch {
      setSuccessful(false);
      setMessage("Unexpected error saving status report configuration");
    } finally {
      setSaving(false);
      setShow(true);
    }
  };

  return (
    <div className="grid grid-cols-[260px_1fr] gap-4 items-start">
      {/* Left column — every site, alphabetical, with a configured mark */}
      <Card className="sticky top-4">
        <CardHeader className="pb-2">
          <CardDescription className="font-medium text-foreground">Sites</CardDescription>
        </CardHeader>
        <CardContent className="p-0">
          {loadingSites ? (
            <div className="p-4">
              <Loading />
            </div>
          ) : (
            <div className="max-h-[70vh] overflow-y-auto">
              {siteOptions.map((s) => {
                const configured = isSiteConfigured(globalConfig, s.id);
                const active = s.id === selectedSiteId;
                return (
                  <button
                    key={s.id}
                    type="button"
                    onClick={() => setSelectedSiteId(s.id)}
                    className={`w-full flex items-center justify-between gap-2 px-3 py-2 text-left text-sm border-b last:border-b-0 transition-colors ${
                      active ? "bg-muted" : "hover:bg-muted/50"
                    }`}
                  >
                    <span className="truncate">{s.siteName}</span>
                    <Badge
                      variant={configured ? "default" : "outline"}
                      className="shrink-0 text-[10px] px-1.5 py-0"
                    >
                      {configured ? "Configured" : "Not set"}
                    </Badge>
                  </button>
                );
              })}
            </div>
          )}
        </CardContent>
      </Card>

      {/* Right column — the bigger panel with all the checks */}
      <div className="min-w-0 flex flex-col max-h-[70vh]">
        <div className="sticky top-0 z-10 bg-background flex items-center justify-between flex-wrap gap-2 pb-3">
          <div className="flex items-center gap-2">
            {selectedSiteId && (
              <span className="font-medium text-sm">
                {siteOptions.find((s) => s.id === selectedSiteId)?.siteName}
              </span>
            )}
            {dirty && <span className="text-xs text-amber-500">Unsaved changes</span>}
          </div>
          <Button onClick={handleSave} disabled={saving || !dirty || !selectedSiteId}>
            {saving ? (
              <>
                <Loader2 className="mr-2 h-4 w-4 animate-spin" />
                Saving…
              </>
            ) : (
              <>
                <Save className="mr-2 h-4 w-4" />
                Save
              </>
            )}
          </Button>
        </div>

        <div className="space-y-4 overflow-y-auto pr-1 flex-1">
          {!selectedSiteId && (
            <p className="text-sm text-muted-foreground py-6 text-center border rounded-md">
              Select a site on the left to configure its Status Report checks.
            </p>
          )}

          {selectedSiteId && loadingSite && <Loading />}

          {selectedSiteId && !loadingSite && (
            <>
              {/* KPI Checks — site-level, one per eligible Formula */}
              <Card>
                <CardHeader className="pb-2">
                  <CardDescription className="font-medium text-foreground">
                    KPI Checks (site-level — evaluated once per formula, not per scale)
                  </CardDescription>
                </CardHeader>
                <CardContent className="space-y-2">
                  {kpiChecks.length === 0 && (
                    <p className="text-sm text-muted-foreground">
                      No formulas on this site have a Min/Max KPI set yet — add one on the
                      Formulas tab first.
                    </p>
                  )}
                  {kpiChecks.map((kpi) => (
                    <div
                      key={kpi.formulaName}
                      className="flex flex-wrap items-center gap-3 border rounded-md p-2"
                    >
                      <Switch
                        checked={kpi.enabled}
                        onCheckedChange={(v) => updateKpiCheck(kpi.formulaName, { enabled: v })}
                      />
                      <span className="font-medium text-sm">{kpi.formulaName}</span>
                      <div className="flex items-center gap-1 ml-auto">
                        <label className="text-xs text-muted-foreground">Pass wording</label>
                        <Input
                          className="w-32 h-8"
                          value={kpi.passLabel ?? ""}
                          onChange={(e) =>
                            updateKpiCheck(kpi.formulaName, { passLabel: e.target.value })
                          }
                        />
                      </div>
                    </div>
                  ))}
                </CardContent>
              </Card>

              {/* Scale Checks — per scale, per check kind */}
              <div className="space-y-2">
                {scales.map((scale) => {
                  const isOpen = expanded.has(scale.iccid);
                  const checks = scaleChecks[scale.iccid] || [];
                  const onCount = checks.filter((c) => c.enabled).length;
                  return (
                    <Card key={scale.iccid}>
                      <button
                        type="button"
                        onClick={() => toggleExpanded(scale.iccid)}
                        className="w-full flex items-center gap-2 p-3 text-left"
                      >
                        {isOpen ? (
                          <ChevronDown className="h-4 w-4" />
                        ) : (
                          <ChevronRight className="h-4 w-4" />
                        )}
                        <span className="font-medium text-sm">{scale.scalename}</span>
                        <span className="text-xs text-muted-foreground ml-2">
                          {onCount} of {CHECK_TYPES.length} checks on
                        </span>
                      </button>

                      {isOpen && (
                        <CardContent className="space-y-2 pt-0">
                          {checks.map((check) => {
                            const meta = getMeta(check.checkType);
                            return (
                              <div
                                key={check.checkType}
                                className="flex flex-wrap items-end gap-3 border rounded-md p-2"
                              >
                                <div className="flex items-center gap-2 min-w-[180px]">
                                  <Switch
                                    checked={check.enabled}
                                    onCheckedChange={(v) =>
                                      updateScaleCheck(scale.iccid, check.checkType, {
                                        enabled: v,
                                      })
                                    }
                                  />
                                  <span className="text-sm font-medium">{meta.label}</span>
                                </div>

                                {meta.needsScaleField && (
                                  <div className="space-y-1">
                                    <label className="text-xs text-muted-foreground">
                                      Reads scale field
                                    </label>
                                    <Select
                                      value={check.scaleField || undefined}
                                      onValueChange={(v) =>
                                        updateScaleCheck(scale.iccid, check.checkType, {
                                          scaleField: v,
                                        })
                                      }
                                    >
                                      <SelectTrigger className="w-40 h-8">
                                        <SelectValue placeholder="Select field" />
                                      </SelectTrigger>
                                      <SelectContent>
                                        {scaleFieldOptions.map((f) => (
                                          <SelectItem key={f.key} value={f.key}>
                                            {f.label}
                                          </SelectItem>
                                        ))}
                                      </SelectContent>
                                    </Select>
                                  </div>
                                )}

                                {meta.thresholdFields.map((t) => (
                                  <div key={t.key} className="space-y-1">
                                    <label className="text-xs text-muted-foreground">
                                      {t.label}
                                    </label>
                                    <Input
                                      type="number"
                                      className="w-32 h-8"
                                      value={check.thresholds?.[t.key] ?? t.default}
                                      onChange={(e) =>
                                        updateScaleCheckThreshold(
                                          scale.iccid,
                                          check.checkType,
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
                                    className="w-28 h-8"
                                    value={check.passLabel ?? ""}
                                    onChange={(e) =>
                                      updateScaleCheck(scale.iccid, check.checkType, {
                                        passLabel: e.target.value,
                                      })
                                    }
                                  />
                                </div>
                              </div>
                            );
                          })}
                        </CardContent>
                      )}
                    </Card>
                  );
                })}
              </div>
            </>
          )}
        </div>
      </div>

      {show && (
        <ResponseModal successful={successful} message={message} setShow={setShow} />
      )}
    </div>
  );
};

export default StatusReport;