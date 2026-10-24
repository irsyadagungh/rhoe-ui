import type { Metadata } from "next";
import type { ReactNode } from "react";
import { Geist, Geist_Mono } from "next/font/google";
import { siteUrl } from "@/lib/site-url";
import "./globals.css";

const geistSans = Geist({ variable: "--font-geist-sans", subsets: ["latin"] });
const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
  fallback: ["ui-monospace", "SFMono-Regular", "Menlo", "Monaco", "Consolas", "Liberation Mono", "Courier New", "monospace"],
  adjustFontFallback: false,
});

export const metadata: Metadata = {
  metadataBase: new URL(siteUrl),
  title: { default: "Rhoe UI · Free preview", template: "%s | Rhoe UI" },
  description: "Develop and preview the free Rhoe UI components and blocks.",
  robots: { index: false, follow: false },
  icons: { icon: "/rhoe-logo.svg" },
};

export default function RootLayout({ children }: { children: ReactNode }) {
  return (
    <html lang="en" suppressHydrationWarning className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}>
      <head>
        <script dangerouslySetInnerHTML={{ __html: `(function(){try{var t=localStorage.getItem("sya-ui-theme");if(t==="light"||t==="dark")document.documentElement.dataset.theme=t;else document.documentElement.removeAttribute("data-theme")}catch(e){}})();` }} />
      </head>
      <body className="min-h-full flex flex-col">{children}</body>
    </html>
  );
}
