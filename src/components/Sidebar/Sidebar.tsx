"use client";

import React from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { users } from "@/data/user";

import { Home, Search, Film, MessageCircle, User } from "lucide-react";

import styles from "./Sidebar.module.css";

export const Sidebar: React.FC = () => {
  const pathname = usePathname();

  const currentUser = users[0];

  const links = [
    { href: "/", label: "Главная", icon: <Home size={22} /> },
    { href: "/SearchPage", label: "Поиск", icon: <Search size={22} /> },
    { href: "/ReelsPage", label: "Видео", icon: <Film size={22} /> },
    { href: "/MessagesPage", label: "Сообщения", icon: <MessageCircle size={22} /> },
    { href: `/ProfilePage/${currentUser.id}`, label: "Профиль", icon: <User size={22} /> },
  ];

  return (
    <aside className={styles.sidebar}>
      <div className={styles.headerText}>
        Project
      </div>
      <nav className={styles.nav}>
        {links.map((link) => {
          const isActive = pathname === link.href;

          return (
            <Link
              key={link.href}
              href={link.href}
              className={`${styles.navItem} ${isActive ? styles.active : ""}`}
            >
              <span className={styles.icon}>{link.icon}</span>
              <span className={styles.label}>{link.label}</span>
            </Link>
          );
        })}
      </nav>
    </aside>
  );
};
