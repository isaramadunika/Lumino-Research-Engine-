import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "LuMino Research Engine",
  description: "A modern design research platform powered by Gemini AI",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body>
        {/* Gemini API is configured via environment variables */}
        {/* Set NEXT_PUBLIC_GEMINI_API_KEY in .env.local */}
        {children}
      </body>
    </html>
  );
}
