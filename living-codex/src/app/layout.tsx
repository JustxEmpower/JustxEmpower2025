import type { Metadata } from "next";
import "./globals.css";
import Providers from "./providers";

export const metadata: Metadata = {
  title: "The Living Codex™ Journey | Just Empower®",
  description:
    "A Woman's Path of Sovereignty & Embodiment — A proprietary archetypal self-assessment and transformation system by Just Empower®.",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en">
      <body className="min-h-screen"><Providers>{children}</Providers></body>
    </html>
  );
}
