import type { Metadata } from "next";
import "./globals.css";

const FASTAPI_CLOUD_URL = "https://fastapicloud.com/";

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
      <body suppressHydrationWarning>
        {children}
        <footer className="border-kiri-line bg-kiri-surface/85 text-kiri-muted w-full border-t px-[clamp(20px,4vw,64px)] py-5 text-center text-sm font-extrabold">
          Served with ❤️ from{" "}
          <a
            className="text-kiri-hero decoration-kiri-accent/45 hover:text-kiri-accent underline underline-offset-3"
            href={FASTAPI_CLOUD_URL}
            rel="noopener noreferrer"
            target="_blank"
          >
            FastAPI Cloud
          </a>
        </footer>
      </body>
    </html>
  );
}
