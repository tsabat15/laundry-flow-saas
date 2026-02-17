import type { Metadata } from "next";
import { Inter } from "next/font/google";
import { AuthProvider } from "../context/AuthContext";
import "./globals.css";

const inter = Inter({ subsets: ["latin"] });

// Metadata penting untuk jualan SaaS kamu nanti agar terindeks Google
export const metadata: Metadata = {
  title: "LaundryPro - SaaS Management",
  description: "Sistem manajemen laundry cerdas untuk bisnis Anda",
};

export default function RootLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  return (
    <html lang="id">
      <body className={inter.className}>
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  );
}