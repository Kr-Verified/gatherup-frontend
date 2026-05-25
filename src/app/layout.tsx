import type { Metadata, Viewport } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "모여라 GatherUp - 모임 일정 조율",
  description: "동창 모임, 친구 모임의 일정을 쉽게 조율하세요. 각자 일정을 입력하면 모두가 가능한 날을 자동으로 찾아드립니다.",
  manifest: "/manifest.webmanifest",
  appleWebApp: {
    capable: true,
    title: "모여라",
    statusBarStyle: "black-translucent",
  },
  icons: {
    icon: "/icon.svg",
    apple: "/icon.svg",
  },
};

export const viewport: Viewport = {
  themeColor: "#7c3aed",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="ko">
      <body>{children}</body>
    </html>
  );
}
