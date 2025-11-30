"use client";

import { usePathname } from "next/navigation";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import { users } from "@/data/users";

export default function ClientControls() {
  const pathname = usePathname();
  const currentUser = users[0];

  return <>
  {pathname == "/MessagesPage" && <ThemeToggle />}
  {pathname == `/ProfilePage/${currentUser.id}` && <ThemeToggle />}
  {pathname == "/" && <ThemeToggle />}
  {pathname == "/SearchPage" && <ThemeToggle />}
  {pathname == "/ReelsPage" && <ThemeToggle />}
  </>;
}
