import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Wedding Planner",
  description: "An AI interview that plans your venue, food, vendors, guest list and budget.",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="en">
      <body>{children}</body>
    </html>
  );
}
