import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./platform.css";
import { Providers } from "@/components/providers";
import { Analytics } from "@vercel/analytics/react";

export const metadata: Metadata = {
  title: {
    default: "ONEORIGIN — Developer workspace",
    template: "%s | ONEORIGIN",
  },
  description:
    "The developer workspace for multi-model AI. Compare streaming responses, ground answers in your knowledge, and observe your AWS-powered AI stack.",
  applicationName: "ONEORIGIN",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
  themeColor: "#000000",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html
      lang="en"
      data-color-mode="dark"
      data-light-theme="light"
      data-dark-theme="dark"
      suppressHydrationWarning
    >
      <body suppressHydrationWarning>
        <Providers>{children}</Providers>
        <Analytics />
      </body>
    </html>
  );
}
