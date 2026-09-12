import {
  BadgeCheck,
  Car,
  CalendarClock,
  Copy,
  FileSearch,
  FileX2,
  GraduationCap,
  Lock,
  MapPin,
  ReceiptText,
  Search,
  ShieldAlert,
  Stethoscope,
  Target,
  TrendingUp,
  UserRoundCog,
  type LucideIcon,
} from "lucide-react";

import { clsx } from "@/lib/clsx";

const ICONS: Record<string, LucideIcon> = {
  FileSearch,
  Search,
  ReceiptText,
  FileX2,
  CalendarClock,
  Car,
  Stethoscope,
  ShieldAlert,
  Copy,
  UserRoundCog,
  GraduationCap,
  TrendingUp,
  Lock,
  BadgeCheck,
  MapPin,
  Target,
};

export function ServiceIcon({
  name,
  className,
}: {
  name: string;
  className?: string;
}) {
  const Icon = ICONS[name] ?? FileSearch;
  return <Icon className={clsx("size-5", className)} aria-hidden />;
}
