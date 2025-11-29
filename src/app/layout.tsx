// layout.tsx (серверный)
import type { Metadata } from "next";
import "./globals.css";
import ThemeProvider from "@/components/Theme/themeProvider";
import {Sidebar} from "@/components/Sidebar/Sidebar";
import ClientControls from "@/components//ClientControls/ClientControls";

export const metadata: Metadata = {
  title: {
    default: "Project",
    template: "%s | Project",
  },
  icons: {
    icon: "/images/favicon.svg",
  },
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" data-scroll-behavior="smooth" suppressHydrationWarning>
      <body>
        <ThemeProvider>
          <div className="app-layout">
            <Sidebar />
            <main className="main-content">
              <ClientControls />
              {children}
            </main>
          </div>
        </ThemeProvider>
      </body>
    </html>
  );
}
