import type { Metadata, Viewport } from "next";
import { Inter } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

export const metadata: Metadata = {
  title: "RedFlag — AI Contract Risk Scanner",
  description:
    "Paste or upload any contract and let AI flag risky clauses, rank them by severity, and explain each in plain English. Get an instant, downloadable risk report.",
  keywords: [
    "contract analysis",
    "AI legal",
    "risk scanner",
    "contract review",
    "NDA",
    "lease",
    "employment agreement",
  ],
  authors: [{ name: "RedFlag Team" }],
  openGraph: {
    title: "RedFlag — AI Contract Risk Scanner",
    description:
      "AI-powered contract risk analysis. Flag risky clauses in seconds.",
    type: "website",
  },
};

export const viewport: Viewport = {
  themeColor: "#0a1929",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={inter.variable}>
      <body className="min-h-screen antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
