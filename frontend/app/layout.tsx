import type { Metadata } from "next";
import "./globals.css";
import { QueryProvider } from "@/lib/query/query-provider";

export const metadata: Metadata = {
  title: "YieldLens - Indian Bond Portfolio Analytics",
  description: "Analyze Indian bond portfolios, exposure, duration, DV01, and simplified rate scenarios."
};

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return (
    <html lang="en">
      <body>
        <QueryProvider>{children}</QueryProvider>
      </body>
    </html>
  );
}
