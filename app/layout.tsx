import type { Metadata } from "next";
import "./globals.css";
import { Navigation } from "@/components/navigation";

export const metadata: Metadata = { title: "FDN QuantCo Dashboard", description: "Read-only performance tracking for FDN." };

export default function RootLayout({ children }: Readonly<{ children: React.ReactNode }>) {
  return <html lang="en"><body><Navigation />{children}</body></html>;
}
