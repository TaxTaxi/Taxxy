// src/app/page.tsx - Enhanced Dashboard with better design
"use client";

import { useEffect } from "react";
import { useIncomeStore } from "@/store/incomeStore";
import { useTransactionStore } from "@/store/transactionStore";
import { TrendingUp, TrendingDown, DollarSign, Receipt, AlertTriangle, Brain, CheckCircle, Clock } from "lucide-react";
import Link from "next/link";

export default function DashboardPage() {
  const { income, loadIncome } = useIncomeStore();
  const { transactions, loadTransactions } = useTransactionStore();

  useEffect(() => {
    loadIncome();
    loadTransactions();
  }, []);

  const totalIncome = income.reduce((sum, item) => sum + item.amount, 0);
  const totalExpenses = Math.abs(transactions
    .filter(tx => tx.amount < 0)
    .reduce((sum, tx) => sum + tx.amount, 0));
  const balance = totalIncome - totalExpenses;

  // Analytics
  const businessExpenses = transactions
    .filter(tx => tx.purpose === 'business' && tx.amount < 0)
    .reduce((sum, tx) => sum + Math.abs(tx.amount), 0);
  
  const unreviewedCount = transactions.filter(tx => !tx.reviewed).length;
  const lowConfidenceCount = transactions.filter(tx => tx.confidence && tx.confidence < 70).length;
  const aiLearnedCount = transactions.filter(tx => tx.learnedFrom && tx.learnedFrom > 0).length;

  const quickStats = [
    {
      label: "Total Income",
      value: totalIncome,
      icon: TrendingUp,
      color: "text-green-600",
      bgColor: "bg-green-50",
      borderColor: "border-green-200"
    },
    {
      label: "Total Expenses", 
      value: totalExpenses,
      icon: TrendingDown,
      color: "text-red-600",
      bgColor: "bg-red-50",
      borderColor: "border-red-200"
    },
    {
      label: "Net Balance",
      value: balance,
      icon: DollarSign,
      color: balance >= 0 ? "text-green-600" : "text-red-600",
      bgColor: balance >= 0 ? "bg-green-50" : "bg-red-50",
      borderColor: balance >= 0 ? "border-green-200" : "border-red-200"
    },
    {
      label: "Business Expenses",
      value: businessExpenses,
      icon: Receipt,
      color: "text-blue-600",
      bgColor: "bg-blue-50",
      borderColor: "border-blue-200"
    }
  ];

  const alertsAndTasks = [
    ...(unreviewedCount > 0 ? [{
      type: 'warning',
      icon: Clock,
      title: `${unreviewedCount} Unreviewed Transactions`,
      description: 'Review AI classifications to improve accuracy',
      action: { label: 'Review Now', href: '/transactions' }
    }] : []),
    ...(lowConfidenceCount > 0 ? [{
      type: 'info',
      icon: AlertTriangle,
      title: `${lowConfidenceCount} Low Confidence Classifications`,
      description: 'Help AI learn by correcting these transactions',
      action: { label: 'Fix Classifications', href: '/transactions' }
    }] : []),
    ...(aiLearnedCount > 0 ? [{
      type: 'success',
      icon: Brain,
      title: `AI Learned from ${aiLearnedCount} Transactions`,
      description: 'Your corrections are improving AI accuracy',
      action: { label: 'View Learning Stats', href: '/transactions' }
    }] : []),
  ];

  return (
    <div className="space-y-8">
      {/* Page Header */}
      <div className="mb-8">
        <h1 className="text-3xl font-bold text-gray-900 mb-2">Dashboard</h1>
        <p className="text-gray-600 text-lg">
          Your financial overview and AI-powered insights
        </p>
      </div>

      {/* Quick Stats Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {quickStats.map((stat, index) => {
          const Icon = stat.icon;
          return (
            <div key={index} className={`bg-white bg-opacity-80 border rounded-xl shadow-lg hover:shadow-xl transition-all duration-300 p-6 ${stat.bgColor} border ${stat.borderColor}`} style={{ backdropFilter: 'blur(8px)', transform: 'translateY(0)' }} onMouseEnter={(e) => e.currentTarget.style.transform = 'translateY(-2px)'} onMouseLeave={(e) => e.currentTarget.style.transform = 'translateY(0)'}>
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">{stat.label}</p>
                  <p className={`text-2xl font-bold ${stat.color}`}>
                    ${Math.abs(stat.value).toLocaleString()}
                  </p>
                </div>
                <div className={`p-3 rounded-full ${stat.bgColor}`}>
                  <Icon className={`w-6 h-6 ${stat.color}`} />
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {/* Alerts and Tasks */}
      {alertsAndTasks.length > 0 && (
        <div className="card-enhanced p-6">
          <h2 className="text-xl font-semibold text-slate-900 mb-4 flex items-center gap-2">
            <AlertTriangle className="w-5 h-5 text-orange-500" />
            Action Items
          </h2>
          <div className="space-y-4">
            {alertsAndTasks.map((alert, index) => {
              const Icon = alert.icon;
              const alertStyles = {
                warning: 'bg-yellow-50 border-yellow-200 text-yellow-800',
                info: 'bg-blue-50 border-blue-200 text-blue-800',
                success: 'bg-green-50 border-green-200 text-green-800',
                error: 'bg-red-50 border-red-200 text-red-800'
              };

              return (
                <div key={index} className={`p-4 rounded-lg border ${alertStyles[alert.type as keyof typeof alertStyles]}`}>
                  <div className="flex items-start justify-between">
                    <div className="flex items-start space-x-3">
                      <Icon className="w-5 h-5 mt-0.5" />
                      <div>
                        <h3 className="font-medium">{alert.title}</h3>
                        <p className="text-sm opacity-90 mt-1">{alert.description}</p>
                      </div>
                    </div>
                    <Link 
                      href={alert.action.href}
                      className="text-sm font-medium hover:underline"
                    >
                      {alert.action.label}
                    </Link>
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Quick Actions */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
        <Link href="/import-csv" className="card-enhanced p-6 hover-lift hover-glow group">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-blue-100 rounded-lg group-hover:bg-blue-200 transition-colors">
              <Receipt className="w-6 h-6 text-blue-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Import Transactions</h3>
              <p className="text-sm text-slate-600">Upload your bank CSV files</p>
            </div>
          </div>
        </Link>

        <Link href="/tax-onboarding" className="card-enhanced p-6 hover-lift hover-glow group">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-purple-100 rounded-lg group-hover:bg-purple-200 transition-colors">
              <Brain className="w-6 h-6 text-purple-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">AI Tax Setup</h3>
              <p className="text-sm text-slate-600">Complete your tax profile</p>
            </div>
          </div>
        </Link>

        <Link href="/tax-report" className="card-enhanced p-6 hover-lift hover-glow group">
          <div className="flex items-center space-x-4">
            <div className="p-3 bg-green-100 rounded-lg group-hover:bg-green-200 transition-colors">
              <CheckCircle className="w-6 h-6 text-green-600" />
            </div>
            <div>
              <h3 className="font-semibold text-slate-900">Generate Tax Report</h3>
              <p className="text-sm text-slate-600">AI-powered tax analysis</p>
            </div>
          </div>
        </Link>
      </div>

      {/* Recent Activity Preview */}
      {transactions.length > 0 && (
        <div className="card-enhanced p-6">
          <div className="flex items-center justify-between mb-4">
            <h2 className="text-xl font-semibold text-slate-900">Recent Transactions</h2>
            <Link 
              href="/transactions" 
              className="text-sm font-medium text-blue-600 hover:text-blue-700"
            >
              View All →
            </Link>
          </div>
          <div className="space-y-3">
            {transactions.slice(0, 3).map((tx) => (
              <div key={tx.id} className="flex items-center justify-between p-3 bg-slate-50/50 rounded-lg">
                <div className="flex-1">
                  <p className="font-medium text-slate-900">{tx.description}</p>
                  <div className="flex items-center space-x-2 mt-1">
                    <span className="text-xs text-slate-500">{new Date(tx.date).toLocaleDateString()}</span>
                    <span className={`badge-${tx.purpose === 'business' ? 'business' : 'personal'}`}>
                      {tx.purpose}
                    </span>
                    {tx.confidence && (
                      <span className={`badge-${
                        tx.confidence >= 80 ? 'high' : tx.confidence >= 60 ? 'medium' : 'low'
                      }-confidence`}>
                        {tx.confidence}%
                      </span>
                    )}
                  </div>
                </div>
                <div className={`font-semibold ${tx.amount >= 0 ? 'text-green-600' : 'text-red-600'}`}>
                  {tx.amount >= 0 ? '+' : ''}${tx.amount.toFixed(2)}
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Empty State */}
      {transactions.length === 0 && income.length === 0 && (
        <div className="card-enhanced p-12 text-center">
          <div className="w-16 h-16 bg-blue-100 rounded-full flex items-center justify-center mx-auto mb-4">
            <Receipt className="w-8 h-8 text-blue-600" />
          </div>
          <h3 className="text-lg font-semibold text-slate-900 mb-2">Welcome to Taxxy!</h3>
          <p className="text-slate-600 mb-6 max-w-sm mx-auto">
            Get started by importing your transactions or setting up your tax profile for AI-powered insights.
          </p>
          <div className="flex flex-col sm:flex-row gap-3 justify-center">
            <Link href="/import-csv" className="btn-primary">
              Import Transactions
            </Link>
            <Link href="/tax-onboarding" className="btn-secondary">
              Setup Tax Profile
            </Link>
          </div>
        </div>
      )}
    </div>
  );
}