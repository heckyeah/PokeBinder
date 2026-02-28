import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";

const geistSans = Geist({
  variable: "--font-geist-sans",
  subsets: ["latin"],
});

const geistMono = Geist_Mono({
  variable: "--font-geist-mono",
  subsets: ["latin"],
});

export const metadata: Metadata = {
  title: "Pokemon Card Binder",
  description: "Track your Pokemon cards in binders with configurable grid sizes and sort order.",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body
        className={`${geistSans.variable} ${geistMono.variable} flex min-h-screen flex-col antialiased`}
      >
        <main className="flex-1">{children}</main>
        <footer className="bg-slate-100 py-3 text-center text-sm text-slate-500">
          <a
            href="https://whothehek.nz"
            target="_blank"
            rel="noopener noreferrer"
            className="font-medium text-slate-700 hover:underline"
          >
            Whothehek.nz
          </a>{" "}
          made this
        </footer>
      </body>
    </html>
  );
}
