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
          These criteria run against every site (test and prod) in the
          twice-daily internal status report. Add, edit, or remove checks —
          nothing here is site-specific.
        </p>
      </div>

      <Card>
        <CardHeader>
          <CardTitle className="text-base">Check Criteria</CardTitle>
          <CardDescription>
            Toggle checks on/off, set their thresholds, and set the wording
            used for pass/fail on the report.
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