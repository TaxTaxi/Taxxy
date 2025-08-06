import Link from "next/link";
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
  title: "Taxxy",
  description: "Manage your taxes and bills with ease",
};

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased bg-gray-50 text-gray-800`}>
        <nav className="bg-white shadow-md p-4 flex gap-6 text-black">
          <Link href="/" className="hover:text-blue-600 transition-colors duration-300">
            Dashboard
          </Link>
          <Link href="/transactions" className="hover:text-blue-600 transition-colors duration-300">
            Transactions
          </Link>
          <Link href="/import-csv" className="hover:text-blue-600 transition-colors duration-300">
            Import CSV
          </Link>
          <Link href="/bills" className="hover:text-blue-600 transition-colors duration-300">
            Bills
          </Link>
          <Link href="/taxes" className="hover:text-blue-600 transition-colors duration-300">
            Taxes
          </Link>
          <Link href="/tax-onboarding" className="hover:text-blue-600 transition-colors duration-300">
  Tax Setup
</Link>
          <Link href="/banks" className="hover:text-blue-600 transition-colors duration-300">
            Bank Accounts
          </Link>
          <Link href="/settings" className="hover:text-blue-600 transition-colors duration-300">
            Settings
          </Link>
        </nav>

        <main className="p-8 space-y-10">{children}</main>
      </body>
    </html>
  );
}