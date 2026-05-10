import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Yunwei Lu | Research Map",
  description: "Interactive superconducting-qubit research map by country.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
