import "./globals.css";
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "Investigação Documental",
  description: "SaaS de investigação documental para advogados",
};

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="pt-BR">
      <body className="font-mono">{children}</body>
    </html>
  );
}
