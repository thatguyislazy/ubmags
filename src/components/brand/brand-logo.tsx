import Image from "next/image";
import { cn } from "@/lib/utils";

export function BrandLogo({
  size = 40,
  className,
  priority,
}: {
  size?: number;
  className?: string;
  priority?: boolean;
}) {
  return (
    <Image
      src="/ub-seal.png"
      alt="University of Batangas seal"
      width={size}
      height={size}
      priority={priority}
      className={cn("rounded-full bg-white", className)}
    />
  );
}

