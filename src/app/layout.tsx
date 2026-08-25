import type { Metadata } from "next";
import "./globals.css";
import ClientLayout from "@/components/ClientLayout";

export const metadata: Metadata = {
  title: "NetManager — WiFi Subscriber Management",
  description: "Professional ISP subscriber management system for WiFi service providers. Manage subscribers, packages, billing, and analytics.",
  keywords: "WiFi, ISP, subscriber management, billing, internet service provider",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning>
      <body suppressHydrationWarning>
        <ClientLayout>{children}</ClientLayout>
      </body>
    </html>
  );
}
