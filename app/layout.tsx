import type { Metadata, Viewport } from "next";
import { Inter, Space_Grotesk } from "next/font/google";
import "./globals.css";
import { Providers } from "./providers";

const inter = Inter({
  subsets: ["latin"],
  variable: "--font-inter",
  display: "swap",
});

const display = Space_Grotesk({
  subsets: ["latin"],
  variable: "--font-display",
  weight: ["500", "600", "700"],
  display: "swap",
});

export const metadata: Metadata = {
  title: "RedFlag — Read between the lines",
  description:
    "RedFlag reviews any contract with AI — flagging risky clauses, ranking them by severity, and explaining each in plain English. Read between the lines before you sign.",
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
  themeColor: "#08090c",
  width: "device-width",
  initialScale: 1,
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" className={`${inter.variable} ${display.variable}`}>
      <body className="min-h-screen bg-ink-950 antialiased">
        <Providers>{children}</Providers>
      </body>
    </html>
  );
}
