// app/(app)/statusreport/page.tsx
"use client";
import {
  Card,
  CardContent,
  CardDescription,
  CardHeader,
  CardTitle,
} from "@/components/ui/card";
import StatusReport from "@/components/widgets/statusReport/StatusReport";

const StatusReportPage = () => {
  return (
    <div className="p-4 space-y-4">
      <div>
        <h1 className="text-lg font-semibold">Status Report</h1>
        <p className="text-sm text-muted-foreground">
          Every site runs in the twice-daily internal status report, but what
          gets checked is configured per site, per scale — pick a site below,
          then turn checks on/off scale by scale. KPI checks are the
          exception: they're evaluated once per site formula, not per scale.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check Criteria</CardTitle>
          <CardDescription>
            Toggle checks on/off, set their thresholds, and set the pass
            wording used on the report.
          </CardDescription>
        </CardHeader>
        <CardContent>
          <StatusReport />
        </CardContent>
      </Card>
    </div>
  );
};

export default StatusReportPage;