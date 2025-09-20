"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

export default function Breadcrumbs() {
  let pathname = usePathname(); // Get current path
  const segments = pathname.split("/");

  pathname = segments.join("/"); // Reconstruct path without last segment

  let pathSegments = pathname.split("/").filter(Boolean); // Remove empty segments

  pathSegments = pathSegments
    .filter((segment) => segment !== "dashboard") //remove dashboard
    .filter((segment) => segment !== "stockpile") //remove stockpile
    .filter((segment) => segment !== "landing") //remove stockpile

    .map((segment) => {
      if (segment === "telegram") return "telegramreporting";
      if (segment === "auditinDashboard") return "auditing";
      if (segment === "progressiveDashboard") return "progressivereporting";
      if (segment === "stockpileDashboard") return "stockpilereporting";
      return segment;
    });

  if (
    pathSegments.length === 3 &&
    (pathSegments[0] === "auditing" ||
      pathSegments[0] === "progressivereporting")
  ) {
    pathSegments = [pathSegments[0], pathSegments[2]];
  }

  return (
    <nav className="text-sm text-muted-foreground px-4">
      <ul className="flex items-center">
        {/* Home Link */}
        <li>
          <Link href="/landing" className="hover:underline">
            Landing
          </Link>
        </li>

        {pathSegments.map((segment, index) => {
          const fullPath = `/${pathSegments.slice(0, index + 1).join("/")}`;
          const isLast = index === pathSegments.length - 1;

          return (
            <li key={fullPath} className="flex items-center">
              <span className="mx-2">/</span>
              {isLast ? (
                <span className="text-primary font-medium">
                  {decodeURIComponent(segment)}
                </span>
              ) : (
                <Link href={fullPath} className="hover:underline">
                  {decodeURIComponent(segment)}
                </Link>
              )}
            </li>
          );
        })}
      </ul>
    </nav>
  );
}
