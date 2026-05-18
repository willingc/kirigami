import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kirigami Workbench",
  description: "A Next.js frontend for the Kirigami Python backend.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body suppressHydrationWarning>{children}</body>
    </html>
  );
}
