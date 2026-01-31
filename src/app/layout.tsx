import type { Metadata } from "next";
import { Inter, Ma_Shan_Zheng } from "next/font/google";
import "./globals.css";

const headingFont = Inter({
  variable: "--font-heading",
  subsets: ["latin"],
  display: "swap",
});

const bodyFont = Inter({
  variable: "--font-body",
  subsets: ["latin"],
  display: "swap",
});

const decorFont = Ma_Shan_Zheng({
  variable: "--font-decor",
  subsets: ["latin"],
  weight: "400",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Photo Wall Studio",
  description:
    "Theme-first photo wall builder for meaningful moments like graduation and Spring Festival.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="zh-CN" data-theme="forest">
      <body
        className={`${headingFont.variable} ${bodyFont.variable} ${decorFont.variable} min-h-screen bg-hero text-ink antialiased`}
      >
        {children}
      </body>
    </html>
  );
}
