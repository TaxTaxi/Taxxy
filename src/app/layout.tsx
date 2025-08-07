// src/app/layout.tsx - Enhanced with better design
import Link from "next/link";
import type { Metadata } from "next";
import { Geist, Geist_Mono } from "next/font/google";
import "./globals.css";
import { Calculator, Receipt, Upload, CreditCard, BarChart3, Banknote, Settings, Brain } from "lucide-react";

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
  description: "AI-powered tax management and expense tracking",
};

const navigation = [
  { name: "Dashboard", href: "/", icon: BarChart3 },
  { name: "Transactions", href: "/transactions", icon: Receipt },
  { name: "Import CSV", href: "/import-csv", icon: Upload },
  { name: "Income", href: "/income", icon: Banknote },
  { name: "Bills", href: "/bills", icon: CreditCard },
  { name: "Tax Report", href: "/tax-report", icon: Calculator },
  { name: "AI Tax Setup", href: "/tax-onboarding", icon: Brain },
  { name: "AI Tax Advisor", href: "/tax-advisor", icon: Brain, className: "font-semibold text-blue-600" },
  { name: "Settings", href: "/settings", icon: Settings },
];

export default function RootLayout({
  children,
}: Readonly<{
  children: React.ReactNode;
}>) {
  return (
    <html lang="en">
      <body className={`${geistSans.variable} ${geistMono.variable} antialiased`}>
        <div className="min-h-screen bg-gradient-to-br from-gray-50 via-blue-50 to-indigo-100">
          {/* Enhanced Navigation */}
          <nav className="bg-white bg-opacity-90 border-b border-gray-200 sticky top-0 z-50" style={{ backdropFilter: 'blur(8px)' }}>
            <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
              <div className="flex justify-between h-16">
                <div className="flex items-center">
                  {/* Logo */}
                  <Link href="/" className="flex items-center space-x-2 mr-8">
                    <div className="w-8 h-8 bg-gradient-to-br from-blue-600 to-indigo-600 rounded-lg flex items-center justify-center">
                      <Calculator className="w-5 h-5 text-white" />
                    </div>
                    <span className="text-xl font-bold bg-gradient-to-r from-blue-600 to-indigo-600 bg-clip-text text-transparent">
                      Taxxy
                    </span>
                  </Link>

                  {/* Navigation Links */}
                  <div className="hidden md:flex space-x-1">
                    {navigation.map((item) => {
                      const Icon = item.icon;
                      return (
                        <Link
                          key={item.name}
                          href={item.href}
                          className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-gray-600 hover:text-gray-900 hover:bg-gray-100 transition-all duration-200"
                        >
                          <Icon className="w-4 h-4" />
                          <span>{item.name}</span>
                        </Link>
                      );
                    })}
                  </div>
                </div>

                {/* Right side - could add user menu, notifications, etc. */}
                <div className="flex items-center space-x-4">
                  <div className="w-8 h-8 bg-gradient-to-br from-slate-200 to-slate-300 rounded-full"></div>
                </div>
              </div>
            </div>

            {/* Mobile Navigation */}
            <div className="md:hidden border-t border-gray-200 bg-white bg-opacity-80" style={{ backdropFilter: 'blur(4px)' }}>
              <div className="px-2 py-2 space-y-1 max-h-64 overflow-y-auto">
                {navigation.map((item) => {
                  const Icon = item.icon;
                  return (
                    <Link
                      key={item.name}
                      href={item.href}
                      className="flex items-center space-x-2 px-3 py-2 rounded-lg text-sm font-medium text-slate-600 hover:text-slate-900 hover:bg-slate-100/60 transition-all duration-200"
                    >
                      <Icon className="w-4 h-4" />
                      <span>{item.name}</span>
                    </Link>
                  );
                })}
              </div>
            </div>
          </nav>

          {/* Main Content */}
          <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
            {children}
          </main>
        </div>
      </body>
    </html>
  );
}