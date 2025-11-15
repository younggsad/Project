import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/Theme/themeProvider";
import ThemeToggle from "@/components/Theme/ThemeToggle";
import { Sidebar } from "@/components/Sidebar/Sidebar";

export const metadata: Metadata = {
  title: {
    default: "Project",
    template: "%s | Project",
  },
  icons: {
    icon: "/images/favicon.svg",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="app-layout">
            <Sidebar />

            <main className="main-content">
              <ThemeToggle />
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
