import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";

import "./globals.css";

import Navbar from "@/components/navigation/Navbar";
import BottomNavigation from "@/components/navigation/BottomNavigation";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "SpeakEasy AI",
  description:
    "Practice English conversations with AI and improve your speaking confidence.",
};

export default function RootLayout({
  children,
}: LayoutProps<"/">) {
  return (
    <html
      lang="en"
      className={`${geistSans.variable} ${geistMono.variable} h-full antialiased`}
    >
      {/* ADDED: Global gradient background and text color */}
      <body className="min-h-full flex flex-col bg-gradient-to-br from-indigo-100 via-purple-50 to-teal-100 text-slate-900 bg-fixed">
        
        <Navbar />

        <div className="flex-1">
          {children}
        </div>

        <BottomNavigation />
        
      </body>
    </html>
  );
}