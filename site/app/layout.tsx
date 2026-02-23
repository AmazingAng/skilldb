import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "skilldb",
  description:
    "Open index of 180K+ agent skills from skills.sh, SkillsMP, and ClawHub.",
  icons: {
    icon: [
      { url: "/favicon.ico", sizes: "any" },
      { url: "/favicon-32.png", sizes: "32x32", type: "image/png" },
      { url: "/favicon-16.png", sizes: "16x16", type: "image/png" },
    ],
    apple: "/apple-touch-icon.png",
  },
  openGraph: {
    title: "skilldb",
    description:
      "Open index of 180K+ agent skills from skills.sh, SkillsMP, and ClawHub.",
    images: [{ url: "/icon-512.png", width: 512, height: 512 }],
  },
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
