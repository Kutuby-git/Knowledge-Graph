import type { Metadata } from "next";
import { Amiri, Nunito } from "next/font/google";
import { ChatPanel } from "@/components/chat/ChatPanel";
import "./globals.css";

const amiri = Amiri({
  subsets: ["arabic", "latin"],
  weight: ["400", "700"],
  variable: "--font-amiri",
  display: "swap",
});

const nunito = Nunito({
  subsets: ["latin"],
  weight: ["400", "600", "700", "800"],
  variable: "--font-nunito",
  display: "swap",
});

export const metadata: Metadata = {
  title: "Quranic Arabic Explorer",
  description:
    "Interactive knowledge graph for learning Quranic Arabic vocabulary",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="en" dir="ltr">
      <body className={`${amiri.variable} ${nunito.variable} antialiased`}>
        {children}
        <ChatPanel />
      </body>
    </html>
  );
}
