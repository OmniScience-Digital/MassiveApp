import {
  Table,
  TableBody,
  TableCell,
  TableHeader,
  TableHead,
  TableRow,
} from "@/components/ui/table";

interface flowTableProps {
  hours: string[];
  dates: string[];
  dateToHourValues: Record<string, Record<string, number>>;
}

export const FlowTable = ({
  hours,
  dates,
  dateToHourValues,
}: flowTableProps) => {
  return (
    <div className="border rounded-lg overflow-hidden">
      <div className="bg-gray-500 font-bold px-4 py-2 text-white text-center">
        RUN TIME TABLE
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
          </TableRow>
        </TableHeader>
        <TableBody>
          {dates.map((date) => (
            <TableRow key={date}>
              <TableCell className="font-medium">{date}</TableCell>
              {hours.map((hour) => (
                <TableCell key={`${date}-${hour}`} className="text-center">
                  {typeof dateToHourValues[date]?.[hour] === "number"
                    ? dateToHourValues[date][hour].toFixed(4)
                    : " "}
                </TableCell>
              ))}
            </TableRow>
          ))}
        </TableBody>
      </Table>
    </div>
  );
};
