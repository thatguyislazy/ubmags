import { cn } from "@/lib/utils";
import { STATUS_COLORS } from "@/lib/constants";

export function Badge({
  status,
  children,
  className,
}: {
  status?: string;
  children: React.ReactNode;
  className?: string;
}) {
  const colorClass = status ? STATUS_COLORS[status] ?? "bg-gray-100 text-gray-800" : "bg-gray-100 text-gray-800";
  return (
    <span className={cn("inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium", colorClass, className)}>
      {children}
    </span>
  );
}
