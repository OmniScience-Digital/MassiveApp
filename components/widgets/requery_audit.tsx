import { Button } from "@/components/ui/button";
import {
  Select,
  SelectContent,
  SelectItem,
  SelectTrigger,
  SelectValue,
} from "@/components/ui/select";
import { RefreshCw } from "lucide-react";

interface DashboardDateSelectorProps {
  dates: string[];
  selectedDate: string;
  onDateSelect: (date: string) => void;
  onRequery: () => void;
  isLoading?: boolean;
}

const DashboardDateSelector = ({ 
  dates, 
  selectedDate, 
  onDateSelect, 
  onRequery,
  isLoading = false
}: DashboardDateSelectorProps) => {
  return (
    <div className="flex items-center gap-2 ml-4">
      <div className="flex items-center">
        <Select value={selectedDate} onValueChange={onDateSelect}>
          <SelectTrigger className="w-[180px] bg-white">
            <SelectValue placeholder="Select a date" />
          </SelectTrigger>
          <SelectContent className="max-h-[300px]">
            {dates.map((date) => (
              <SelectItem key={date} value={date}>
                {new Date(date).toLocaleDateString()}
              </SelectItem>
            ))}
          </SelectContent>
        </Select>
      </div>
      
      <Button 
        onClick={onRequery}
        disabled={isLoading}
        className="bg-blue-600 hover:bg-blue-700 text-white"
        size="sm"
      >
        {isLoading ? (
          <RefreshCw className="h-4 w-4 animate-spin mr-1" />
        ) : (
          <RefreshCw className="h-4 w-4 mr-1" />
        )}
        Requery
      </Button>
    </div>
  );
};

export default DashboardDateSelector;