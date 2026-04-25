import type { Metadata } from "next";
import { config } from "@/lib/config";
import { ThemeProvider } from "@/components/ThemeProvider";
import "./globals.css";

export const metadata: Metadata = {
  title: config.name,
  description: config.siteDescription || config.name,
  other: {
    bmstable: "/header.json",
  },
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ja" suppressHydrationWarning>
      <body>
        <ThemeProvider
          lightTheme={config.lightTheme}
          darkTheme={config.darkTheme}
          darkMode={config.darkMode}
        >
          {children}
        </ThemeProvider>
      </body>
    </html>
  );
}
