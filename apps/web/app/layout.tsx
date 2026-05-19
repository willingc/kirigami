import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Kirigami",
  description: "A guided reader for long discuss.python.org threads.",
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
