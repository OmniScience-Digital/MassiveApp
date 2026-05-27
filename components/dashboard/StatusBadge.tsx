import React from "react";

export function StatusBadge({ status }: { status: string }) {
  const s = (status || "").toLowerCase();
  const styles =
    s === "prod"
      ? "bg-green-100 text-green-800 dark:bg-green-900/30 dark:text-green-400"
      : s === "test"
      ? "bg-yellow-100 text-yellow-800 dark:bg-yellow-900/30 dark:text-yellow-400"
      : "bg-gray-100 text-gray-600 dark:bg-gray-800 dark:text-gray-400";
  const dot =
    s === "prod" ? "bg-green-500" : s === "test" ? "bg-yellow-500" : "bg-gray-400";
  return (
    <span className={`inline-flex items-center px-2 py-0.5 rounded-full text-xs font-medium ${styles}`}>
      <span className={`mr-1 h-1.5 w-1.5 rounded-full ${dot}`} />
      {s === "prod" ? "PROD" : s === "test" ? "TEST" : "OFF"}
    </span>
  );
}
