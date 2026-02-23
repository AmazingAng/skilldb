import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "skilldb",
  description:
    "Open index of 180K+ agent skills from skills.sh, SkillsMP, and ClawHub.",
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
