import type { Metadata } from "next";
import "./globals.css";

export const metadata: Metadata = {
  title: "Connect Player — Sua conta premium começa aqui",
  description: "Contas premium de streaming com entrega instantânea por e-mail. Netflix, Spotify, Disney+, IPTV e muito mais com os melhores preços.",
  keywords: "streaming, contas premium, netflix, spotify, iptv, connect player",
  openGraph: {
    title: "Connect Player",
    description: "Sua conta premium começa aqui",
    type: "website",
  },
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="pt-BR">
      <body>{children}</body>
    </html>
  );
}
