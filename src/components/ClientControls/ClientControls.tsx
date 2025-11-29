"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/Theme/ThemeToggle";

export default function ClientControls() {
  const pathname = usePathname();

  return <>{pathname !== "/MessagesPage" && <ThemeToggle />}</>;
}
