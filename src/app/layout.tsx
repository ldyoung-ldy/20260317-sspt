import type { Metadata } from "next";
import { DM_Sans, JetBrains_Mono } from "next/font/google";
import { AppHeader } from "@/components/app-header";
import "./globals.css";

const dmSans = DM_Sans({
  variable: "--font-body-face",
  subsets: ["latin"],
});

const jetBrainsMono = JetBrains_Mono({
  variable: "--font-mono-face",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "AI 赛事业务管理平台",
  description: "单租户 MVP：赛事配置、报名、作品提交、评分与排名公示",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html
      lang="zh-CN"
      className={`${dmSans.variable} ${jetBrainsMono.variable} h-full antialiased`}
    >
      <body className="min-h-full flex flex-col bg-background text-foreground font-sans">
        <AppHeader />
        <main className="flex flex-1 flex-col">{children}</main>
      </body>
    </html>
  );
}
