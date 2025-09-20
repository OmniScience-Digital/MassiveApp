import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";

interface SinglePurpleFigures {
  hours: string[];
  dates: string[];
  allCalculatedValues: Record<string, Record<string, Record<string, number>>>;
  calculatedValues: Record<string, Record<string, number>>;
}

export const SinglePurpleFigures = ({
  hours,
  dates,
  calculatedValues,
  allCalculatedValues,
}: SinglePurpleFigures) => {
  return (
    <>
      {(Object.keys(calculatedValues).length > 0 ||
        Object.keys(allCalculatedValues).length > 0) && (
        <div className="border rounded-lg overflow-hidden">
          <div className="bg-purple-500 font-bold px-4 py-2 text-white text-center">
            PURPLE FIGURES TABLE
          </div>
          <Table className="min-w-full">
            <TableHeader>
              <TableRow>
                <TableHead className="w-[120px]">Date</TableHead>
                {hours.map((hour) => (
                  <TableHead key={hour} className="text-center">
                    {hour}
                  </TableHead>
                ))}
                <TableHead className="text-center font-bold">
                  Day Total (06-05)
                </TableHead>
              </TableRow>
            </TableHeader>
            <TableBody>
              {dates.map((date, dateIndex) => {
                const currentDaySum = hours
                  .filter((hour) => hour >= "06")
                  .reduce(
                    (sum, hour) => sum + (calculatedValues[date]?.[hour] || 0),
                    0,
                  );

                const nextDate = dates[dateIndex + 1];
                const nextDaySum = nextDate
                  ? hours
                      .filter((hour) => hour <= "05")
                      .reduce(
                        (sum, hour) =>
                          sum + (calculatedValues[nextDate]?.[hour] || 0),
                        0,
                      )
                  : 0;

                const dayTotal = currentDaySum + nextDaySum;

                return (
                  <TableRow key={date}>
                    <TableCell className="font-medium">{date}</TableCell>
                    {hours.map((hour) => (
                      <TableCell
                        key={`${date}-${hour}`}
                        className="text-center text-purple-700 font-bold"
                      >
                        {calculatedValues[date]?.[hour]?.toFixed(4) || " "}
                      </TableCell>
                    ))}
                    <TableCell className="text-center font-bold bg-purple-400">
                      {dayTotal.toFixed(4)}
                    </TableCell>
                  </TableRow>
                );
              })}
              <TableRow className="bg-purple-100">
                <TableCell
                  colSpan={hours.length + 1}
                  className="font-bold text-right pr-10 bg-slate-400"
                >
                  Progressive Total (06-05):
                </TableCell>
                <TableCell className="text-center font-bold bg-purple-400">
                  {dates
                    .reduce((totalSum, date, dateIndex) => {
                      const current = hours
                        .filter((hour) => hour >= "06")
                        .reduce(
                          (sum, hour) =>
                            sum + (calculatedValues[date]?.[hour] || 0),
                          0,
                        );

                      const nextDate = dates[dateIndex + 1];
                      const next = nextDate
                        ? hours
                            .filter((hour) => hour <= "05")
                            .reduce(
                              (sum, hour) =>
                                sum + (calculatedValues[nextDate]?.[hour] || 0),
                              0,
                            )
                        : 0;

                      return totalSum + current + next;
                    }, 0)
                    .toFixed(4)}
                </TableCell>
              </TableRow>
            </TableBody>
          </Table>
        </div>
      )}
    </>
  );
};

interface AllIccidsPurpleFiguresProps {
  allIccids: string[];
  allCalculatedValues: Record<string, Record<string, Record<string, number>>>;
  hours: string[];
}

export const AllIccidsPurpleFigures = ({
  allIccids,
  allCalculatedValues,
  hours,
}: AllIccidsPurpleFiguresProps) => {
  const iccidsWithData = allIccids.filter(
    (iccid) =>
      allCalculatedValues[iccid] &&
      Object.keys(allCalculatedValues[iccid]).length > 0,
  );

  const progressiveTotals: Record<string, number> = {};
  iccidsWithData.forEach((iccid) => {
    const iccidDates = Object.keys(allCalculatedValues[iccid] || {}).sort();
    progressiveTotals[iccid] = iccidDates.reduce((total, date, dateIndex) => {
      const currentDaySum = hours
        .filter((hour) => hour >= "06")
        .reduce(
          (sum, hour) =>
            sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0),
          0,
        );

      const nextDate = iccidDates[dateIndex + 1];
      const nextDaySum = nextDate
        ? hours
            .filter((hour) => hour <= "05")
            .reduce(
              (sum, hour) =>
                sum + (allCalculatedValues[iccid]?.[nextDate]?.[hour] || 0),
              0,
            )
        : 0;

      return total + currentDaySum + nextDaySum;
    }, 0);
  });

  if (iccidsWithData.length === 0) {
    return (
      <div className="border rounded-lg overflow-hidden mt-8 p-4 text-center">
        <div className="bg-purple-500 font-bold px-4 py-2 text-white">
          ALL ICCIDS PURPLE FIGURES
        </div>
        <p className="py-4">
          No calculated data available. Please calculate for ICCIDs first.
        </p>
      </div>
    );
  }

  return (
    <div className="border rounded-lg overflow-hidden mt-8">
      <div className="bg-purple-500 font-bold px-4 py-2 text-white text-center">
        ALL ICCIDS PURPLE FIGURES
      </div>
      <div className="overflow-x-auto max-h-[600px]">
        <Table className="min-w-full">
          <TableHeader className="sticky top-0 bg-gray-100">
            <TableRow>
              <TableHead className="w-[120px]">ICCID</TableHead>
              <TableHead className="w-[120px]">Date</TableHead>
              {hours.map((hour) => (
                <TableHead key={hour} className="text-center">
                  {hour}
                </TableHead>
              ))}
              <TableHead className="text-center font-bold">
                Day Total (06-05)
              </TableHead>
            </TableRow>
          </TableHeader>
          <TableBody>
            {iccidsWithData.flatMap((iccid) => {
              const iccidDates = Object.keys(
                allCalculatedValues[iccid] || {},
              ).sort();
              return [
                ...iccidDates.map((date, dateIndex) => {
                  const currentDaySum = hours
                    .filter((hour) => hour >= "06")
                    .reduce(
                      (sum, hour) =>
                        sum + (allCalculatedValues[iccid]?.[date]?.[hour] || 0),
                      0,
                    );

                  const nextDate = iccidDates[dateIndex + 1];
                  const nextDaySum = nextDate
                    ? hours
                        .filter((hour) => hour <= "05")
                        .reduce(
                          (sum, hour) =>
                            sum +
                            (allCalculatedValues[iccid]?.[nextDate]?.[hour] ||
                              0),
                          0,
                        )
                    : 0;

                  const dayTotal = currentDaySum + nextDaySum;

                  return (
                    <TableRow key={`${iccid}-${date}`}>
                      <TableCell className="font-medium">{iccid}</TableCell>
                      <TableCell className="font-medium">{date}</TableCell>
                      {hours.map((hour) => (
                        <TableCell
                          key={`${iccid}-${date}-${hour}`}
                          className="text-center text-purple-700 font-bold"
                        >
                          {allCalculatedValues[iccid]?.[date]?.[hour]?.toFixed(
                            4,
                          ) || "0.0000"}
                        </TableCell>
                      ))}
                      <TableCell className="text-center font-bold bg-purple-400">
                        {dayTotal.toFixed(4)}
                      </TableCell>
                    </TableRow>
                  );
                }),
                <TableRow key={`${iccid}-total`} className="bg-purple-50">
                  <TableCell
                    colSpan={hours.length + 2}
                    className="font-bold text-right pr-10 bg-slate-500"
                  >
                    Progressive Total for {iccid}:
                  </TableCell>
                  <TableCell className="text-center font-bold bg-purple-400">
                    {progressiveTotals[iccid]?.toFixed(4) || "0.0000"}
                  </TableCell>
                </TableRow>,
              ];
            })}
            <TableRow className="bg-purple-100">
              <TableCell
                colSpan={hours.length + 2}
                className="font-bold text-right pr-10 bg-slate-500"
              >
                GRAND TOTAL:
              </TableCell>
              <TableCell className="text-center font-bold bg-purple-400">
                {Object.values(progressiveTotals)
                  .reduce((sum, total) => sum + total, 0)
                  .toFixed(4)}
              </TableCell>
            </TableRow>
          </TableBody>
        </Table>
      </div>
    </div>
  );
};
