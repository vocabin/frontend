import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Vocabin",
  description: "영단어 복습 웹앱",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="ko" className="h-full">
      <body className="min-h-full antialiased">{children}</body>
    </html>
  );
}
