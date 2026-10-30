import type { Metadata, Viewport } from "next";
import "./globals.css";
import "./platform.css";
import { Providers } from "@/components/providers";

export const metadata: Metadata = {
  title: {
    default: "AI Origin — Your AI, in one place",
    template: "%s | AI Origin",
  },
  description:
    "The developer workspace for multi-model AI. Compare streaming responses, ground answers in your knowledge, and observe your AWS-powered AI stack.",
  applicationName: "AI Origin",
  robots: { index: false, follow: false },
};

export const viewport: Viewport = {
  width: "device-width",
  initialScale: 1,
  colorScheme: "dark",
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
      </body>
    </html>
  );
}
