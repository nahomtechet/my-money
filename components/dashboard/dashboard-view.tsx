"use client";

import { signOut, useSession } from "next-auth/react";
import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { AddTransactionDialog } from "@/components/transactions/add-transaction-dialog";
import { GlassCard } from "@/components/ui/glass-card";
import { NotificationPopover } from "@/components/notifications/notification-popover";
import Link from "next/link";
import { motion } from "framer-motion";
import {
  Eye,
  EyeOff,
  Settings,
  TrendingUp,
  Wallet,
  ArrowDownLeft,
  ArrowUpRight,
  PieChart,
  Target,
  ArrowDownRight,
  ChevronRight,
  Maximize,
  Minimize,
  ChevronDown,
  ChevronUp,
  Coins,
} from "lucide-react";

interface DashboardViewProps {
  stats: {
    balance: number;
    income: number;
    expenses: number;
    growthPercentage: number;
    savingsRate: number;
    biggestExpense: { amount: number; category: string };
    cashBalance: number;
    accountsBalances: any[];
  };
  recentTransactions: any[];
  categories: any[];
  cashFlow: any[];
  goalsCount: number;
  projections: {
    dailyAvgExpense: number;
    projectedEndMonthBalance: number;
    isPositive: boolean;
  };
  budgetAlerts: any[];
}

export function DashboardView({
  stats,
  recentTransactions,
  categories,
  cashFlow = [],
  goalsCount = 0,
  projections = { dailyAvgExpense: 0, projectedEndMonthBalance: 0, isPositive: true },
  budgetAlerts = []
}: DashboardViewProps) {
  const { data: session } = useSession();
  const router = useRouter();
  const [isBalanceVisible, setIsBalanceVisible] = useState(true);
  const [isFullscreen, setIsFullscreen] = useState(false);
  const [showAllAccounts, setShowAllAccounts] = useState(false);

  const activeBankAccounts = stats.accountsBalances.filter(acc => acc.balance > 0);
  const isCashActive = stats.cashBalance > 0;
  const totalVisible = (isCashActive ? 1 : 0) + activeBankAccounts.length;

  const toggleFullscreen = () => {
    if (!document.fullscreenElement) {
      document.documentElement.requestFullscreen().catch((err) => {
        console.error(
          `Error attempting to enable full-screen mode: ${err.message} (${err.name})`,
        );
      });
    } else {
      if (document.exitFullscreen) {
        document.exitFullscreen();
      }
    }
  };

  useEffect(() => {
    const handleFullscreenChange = () => {
      setIsFullscreen(!!document.fullscreenElement);
    };
    document.addEventListener("fullscreenchange", handleFullscreenChange);
    return () =>
      document.removeEventListener("fullscreenchange", handleFullscreenChange);
  }, []);

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 20 },
    show: { opacity: 1, y: 0 },
  };

  const [greeting, setGreeting] = useState("");

  useEffect(() => {
    const updateGreeting = () => {
      const now = new Date();
      const hour = now.getHours();

      if (hour < 12) setGreeting("Good morning");
      else if (hour < 18) setGreeting("Good afternoon");
      else setGreeting("Good evening");
    };

    updateGreeting();
    // Update every minute
    const interval = setInterval(updateGreeting, 60000);
    return () => clearInterval(interval);
  }, []);

  return (
    <div className="min-h-screen animate-mesh text-slate-900 pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-6 pt-6 space-y-6"
      >
        {/* Header Greeting */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div>
            <p className="text-slate-500 font-medium text-[10px] uppercase tracking-wider">
              {greeting || "Welcome"} &bull;{" "}
              {new Date().toLocaleDateString("en-US", {
                weekday: "short",
                month: "short",
                day: "numeric",
              })}
            </p>
            <h1 className="text-2xl font-black tracking-tighter text-slate-900 flex items-center gap-2">
              Hey, {session?.user?.name?.split(" ")[0] || "User"}{" "}
              <span className="animate-bounce">👋</span>
            </h1>
          </div>
          <div className="flex items-center gap-2">
            <NotificationPopover />
            <button
              onClick={toggleFullscreen}
              className="w-10 h-10 flex items-center justify-center rounded-full glass hover:bg-white/60 transition-colors"
              title={isFullscreen ? "Exit Fullscreen" : "Enter Fullscreen"}
            >
              {isFullscreen ? (
                <Minimize className="w-5 h-5 text-slate-700" />
              ) : (
                <Maximize className="w-5 h-5 text-slate-700" />
              )}
            </button>
            <Link
              href="/settings"
              className="w-10 h-10 flex items-center justify-center rounded-full glass hover:bg-white/60 transition-colors"
            >
              <Settings className="w-5 h-5 text-slate-700" />
            </Link>
          </div>
        </motion.div>

        {/* Hero Balance Card */}
        <motion.div variants={itemVariants}>
          <div className="bg-[#008080] rounded-[2rem] p-8 text-white shadow-2xl shadow-teal-900/20 relative overflow-hidden group">
            <div className="absolute top-[-20%] right-[-10%] w-[50%] h-[80%] bg-white/10 blur-[90px] rounded-full group-hover:bg-white/15 transition-colors" />

            <div className="space-y-6 relative z-10">
              <div className="space-y-2">
                <div className="flex items-center gap-2">
                  <p className="text-teal-50/80 font-medium tracking-wide text-xs">
                    Total Balance
                  </p>
                  <button
                    onClick={() => setIsBalanceVisible(!isBalanceVisible)}
                    className="p-1.5 hover:bg-white/10 rounded-lg transition-colors big-click"
                  >
                    {isBalanceVisible ? (
                      <Eye className="w-4 h-4 opacity-70" />
                    ) : (
                      <EyeOff className="w-4 h-4 opacity-70" />
                    )}
                  </button>
                </div>
                <h2 className="text-4xl md:text-5xl font-black tracking-tighter tabular-nums drop-shadow-sm flex items-baseline gap-2">
                  {isBalanceVisible
                    ? stats.balance.toLocaleString()
                    : "••••"}
                  <span className="text-sm md:text-base opacity-60 font-medium">ETB</span>
                </h2>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2 hover:bg-white/15 transition-colors border border-white/10">
                  <div className="flex items-center gap-2 text-teal-100/90">
                    <div className="p-1 bg-white/10 rounded-full">
                      <ArrowDownLeft className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Income
                    </span>
                  </div>
                  <p className="text-xl font-black tabular-nums flex items-baseline gap-1">
                    {isBalanceVisible
                      ? stats.income.toLocaleString()
                      : "••••"}
                    <span className="text-[10px] opacity-60 font-medium">ETB</span>
                  </p>
                </div>
                <div className="bg-white/10 backdrop-blur-md rounded-2xl p-4 space-y-2 hover:bg-white/15 transition-colors border border-white/10">
                  <div className="flex items-center gap-2 text-teal-100/90">
                    <div className="p-1 bg-white/10 rounded-full">
                      <ArrowUpRight className="w-3.5 h-3.5" />
                    </div>
                    <span className="text-[10px] font-bold uppercase tracking-widest">
                      Expenses
                    </span>
                  </div>
                  <p className="text-xl font-black tabular-nums text-rose-300 flex items-baseline gap-1">
                    {isBalanceVisible
                      ? stats.expenses.toLocaleString()
                      : "••••"}
                    <span className="text-[10px] opacity-60 font-medium">ETB</span>
                  </p>
                </div>
              </div>
            </div>
          </div>
        </motion.div>

        {/* Account Balances Section */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-slate-400">
              Accounts & Balances
            </h3>
            {totalVisible > 3 && (
              <button
                onClick={() => setShowAllAccounts(!showAllAccounts)}
                className="flex items-center gap-1.5 px-3 py-1.5 glass rounded-xl text-[10px] font-black uppercase tracking-widest text-teal-600 hover:bg-teal-50 transition-colors"
              >
                {showAllAccounts ? (
                  <>
                    Show Less <ChevronUp className="w-3 h-3" />
                  </>
                ) : (
                  <>
                    See All ({totalVisible}){" "}
                    <ChevronDown className="w-3 h-3" />
                  </>
                )}
              </button>
            )}
          </div>

          <div
            className={`transition-all duration-500 ease-in-out ${
              showAllAccounts
                ? "grid grid-cols-2 gap-3"
                : "flex gap-3 overflow-x-auto pb-2 scrollbar-none"
            }`}
          >
            {/* Cash Account */}
            {isCashActive && (
              <div
                className={`glass p-4 rounded-2xl space-y-1 transition-all ${
                  showAllAccounts ? "w-full" : "flex-none w-36"
                }`}
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <Wallet className="w-3 h-3" />
                  <span className="text-[9px] font-bold uppercase tracking-widest">
                    Cash
                  </span>
                </div>
                <p className="text-sm font-black tabular-nums">
                  {isBalanceVisible
                    ? `${stats.cashBalance.toLocaleString()}`
                    : "••••"}
                  <span className="text-[9px] ml-1 opacity-50">ETB</span>
                </p>
              </div>
            )}

            {/* Bank Accounts */}
            {(showAllAccounts
              ? activeBankAccounts
              : activeBankAccounts.slice(0, isCashActive ? 2 : 3)
            ).map((acc: any) => (
              <div
                key={acc.id}
                className={`glass p-4 rounded-2xl space-y-1 transition-all ${
                  showAllAccounts ? "w-full" : "flex-none w-36"
                }`}
              >
                <div className="flex items-center gap-2 text-slate-400">
                  <div className="p-0.5 bg-slate-100 rounded text-[10px]">
                    {acc.type === "BANK" ? "🏦" : "📱"}
                  </div>
                  <span className="text-[9px] font-bold uppercase tracking-widest truncate">
                    {acc.name}
                  </span>
                </div>
                <p className="text-sm font-black tabular-nums">
                  {isBalanceVisible
                    ? `${acc.balance.toLocaleString()}`
                    : "••••"}
                  <span className="text-[9px] ml-1 opacity-50">ETB</span>
                </p>
              </div>
            ))}

            {/* Hint if hidden */}
            {!showAllAccounts && totalVisible > 3 && (
              <button
                onClick={() => setShowAllAccounts(true)}
                className="flex-none w-36 glass p-4 rounded-2xl flex flex-col items-center justify-center gap-1 group bg-slate-50/50 hover:bg-slate-50 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-slate-100 flex items-center justify-center group-hover:bg-teal-100 transition-colors">
                  <ChevronRight className="w-4 h-4 text-slate-400 group-hover:text-teal-600" />
                </div>
                <span className="text-[8px] font-black text-slate-400 uppercase tracking-widest">
                  +{totalVisible - 3} More
                </span>
              </button>
            )}
          </div>
        </motion.div>

        {/* Budget Nudges (Advanced Feature) */}
        {budgetAlerts?.length > 0 && (
          <motion.div variants={itemVariants} className="space-y-3">
            <h3 className="text-[10px] font-black uppercase tracking-[0.2em] text-rose-400">
              Budget Alerts
            </h3>
            <div className="flex gap-3 overflow-x-auto pb-2 scrollbar-none">
              {budgetAlerts.map((alert: any) => (
                <div 
                  key={alert.category}
                  className={`flex-none w-48 glass p-4 rounded-2xl border-l-4 ${alert.isPulse ? "border-rose-500 animate-pulse-soft" : "border-amber-400"} space-y-2`}
                >
                  <div className="flex items-center justify-between">
                    <span className="text-[10px] font-black uppercase tracking-widest text-slate-700">{alert.category}</span>
                    <span className={`text-[10px] font-black ${alert.isPulse ? "text-rose-600" : "text-amber-600"}`}>{alert.percentage}%</span>
                  </div>
                  <div className="w-full h-1.5 bg-slate-100 rounded-full overflow-hidden">
                    <div 
                      className={`h-full transition-all ${alert.isPulse ? "bg-rose-500" : "bg-amber-500"}`} 
                      style={{ width: `${Math.min(alert.percentage, 100)}%` }}
                    />
                  </div>
                  <p className="text-[9px] font-bold text-slate-400">
                    {alert.spent.toLocaleString()} / {alert.limit.toLocaleString()} ETB
                  </p>
                </div>
              ))}
            </div>
          </motion.div>
        )}


        {/* Quick Action Row */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <AddTransactionDialog
            categories={categories}
            onSuccess={() => router.refresh()}
          />

          <Link
            href="/budgets"
            className="glass flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] hover:scale-[1.03] transition-all group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-violet-100/50 text-violet-600 group-hover:bg-violet-100 transition-colors">
              <PieChart className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center text-slate-600">
              Budget
              <br />
              Goals
            </span>
          </Link>

          <Link
            href="/goals"
            className="glass flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] hover:scale-[1.03] transition-all group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-orange-100/50 text-orange-600 group-hover:bg-orange-100 transition-colors">
              <Target className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center text-slate-600">
              {goalsCount > 0
                ? `${goalsCount} Active Goals`
                : "Set Financial Goals"}
            </span>
          </Link>

          <Link
            href="/equb"
            className="glass flex flex-col items-center justify-center gap-2 p-4 rounded-[1.5rem] hover:scale-[1.03] transition-all group"
          >
            <div className="w-10 h-10 flex items-center justify-center rounded-xl bg-teal-100/50 text-teal-600 group-hover:bg-teal-100 transition-colors">
              <Coins className="w-5 h-5" />
            </div>
            <span className="text-[9px] font-black uppercase tracking-widest leading-tight text-center text-slate-600">
              Personal
              <br />
              Equbs
            </span>
          </Link>
        </motion.div>

        {/* Cash Flow Section */}
        <motion.div variants={itemVariants} className="space-y-3">
          <GlassCard className="p-6 rounded-[2rem]">
            <div className="flex items-center justify-between mb-6">
              <div>
                <h3 className="text-lg font-black tracking-tight text-slate-800">
                  Cash Flow
                </h3>
                <p className="text-slate-500 text-[9px] font-bold uppercase tracking-widest">
                  Last 7 days activity
                </p>
              </div>

              <div className="flex gap-2">
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-[9px] font-bold text-slate-400">
                    Income
                  </span>
                </div>
                <div className="flex items-center gap-1">
                  <div className="w-2 h-2 bg-rose-500 rounded-full" />
                  <span className="text-[9px] font-bold text-slate-400">
                    Expenses
                  </span>
                </div>
              </div>
            </div>

            {/* Real Chart Visualization */}
            <div className="h-32 flex items-end justify-between gap-1 relative overflow-hidden group">
              <div className="absolute inset-0 flex flex-col justify-between pointer-events-none opacity-20">
                {Array(5)
                  .fill(0)
                  .map((_, i) => (
                    <div
                      key={i}
                      className="w-full h-px bg-slate-200 border-t border-dashed border-slate-400"
                    />
                  ))}
              </div>

              {cashFlow.map((day: any) => {
                const maxVal = Math.max(
                  ...cashFlow.map((d: any) =>
                    Math.max(d.income, d.expenses, 1),
                  ),
                );
                const incomeHeight = (day.income / maxVal) * 80;
                const expenseHeight = (day.expenses / maxVal) * 80;

                return (
                  <div
                    key={day.day}
                    className="flex-1 flex flex-col items-center gap-1 group/day relative"
                  >
                    <div className="absolute bottom-6 opacity-0 group-hover/day:opacity-100 transition-opacity bg-white border border-slate-100 shadow-lg rounded-lg p-1.5 z-20 min-w-[70px]">
                      <p className="text-[8px] font-black text-slate-400 uppercase mb-0.5 tracking-widest">
                        {day.day}
                      </p>
                      <div className="space-y-0.5">
                        <p className="text-[8px] font-bold text-emerald-600">
                          income : {day.income.toLocaleString()}
                        </p>
                        <p className="text-[8px] font-bold text-rose-600">
                          expense : {day.expenses.toLocaleString()}
                        </p>
                      </div>
                    </div>
                    <div className="flex items-end gap-0.5 w-full justify-center">
                      <div
                        style={{ height: `${Math.max(incomeHeight, 2)}px` }}
                        className="w-1 bg-emerald-500/20 rounded-full group-hover/day:bg-emerald-500 transition-colors"
                      />
                      <div
                        style={{ height: `${Math.max(expenseHeight, 2)}px` }}
                        className="w-1 bg-rose-500/20 rounded-full group-hover/day:bg-rose-500 transition-colors"
                      />
                    </div>
                    <span className="text-[8px] font-black text-slate-400">
                      {day.day}
                    </span>
                  </div>
                );
              })}
            </div>

            <div className={`mt-4 p-3 ${projections.isPositive ? 'bg-emerald-50 border-emerald-100' : 'bg-rose-50 border-rose-100'} border rounded-xl flex items-center gap-3 group transition-colors`}>
              <div className={`w-8 h-8 ${projections.isPositive ? 'bg-emerald-100' : 'bg-rose-100'} shadow-sm rounded-lg flex items-center justify-center group-hover:scale-110 transition-transform`}>
                <TrendingUp className={`w-5 h-5 ${projections.isPositive ? 'text-emerald-600' : 'text-rose-600'}`} />
              </div>
              <div>
                <h4 className="text-[10px] font-black text-slate-800 tracking-tight leading-none uppercase">
                  Projected month-end balance
                </h4>
                <div className="flex items-baseline gap-2 mt-1">
                  <p className={`text-sm font-black tabular-nums ${projections.isPositive ? 'text-emerald-700' : 'text-rose-700'}`}>
                    {projections.projectedEndMonthBalance.toLocaleString()} <span className="text-[8px] opacity-60">ETB</span>
                  </p>
                  <span className="text-[8px] font-bold text-slate-400 uppercase tracking-wide">
                    Avg: {projections.dailyAvgExpense} ETB/day
                  </span>
                </div>
              </div>
            </div>
          </GlassCard>
        </motion.div>

        {/* Bottom Stats Grid */}
        <motion.div variants={itemVariants} className="grid grid-cols-2 gap-3">
          <div className="bg-[#008080] rounded-[1.5rem] p-5 text-white shadow-lg flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-2 right-2 p-2 bg-white/10 rounded-lg">
              <Wallet className="w-5 h-5 text-white" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-teal-100/70 font-bold text-[10px]">
                Savings Rate
              </h3>
              <p className="text-3xl font-black tabular-nums">
                {stats.savingsRate}%
              </p>
              <p className="text-[8px] font-bold text-teal-100/50 uppercase tracking-widest mt-1">
                of income saved
              </p>
            </div>
          </div>

          <div className="bg-[#fdf8f4] rounded-[1.5rem] p-5 border border-[#f9f1e8] shadow-sm flex flex-col justify-between relative overflow-hidden group hover:scale-[1.02] transition-all">
            <div className="absolute top-2 right-2 p-2 bg-orange-500/10 rounded-lg">
              <ArrowDownRight className="w-5 h-5 text-orange-500/30" />
            </div>
            <div className="space-y-0.5">
              <h3 className="text-slate-400 font-bold text-[10px]">
                Biggest Expense
              </h3>
              <p className="text-2xl font-black tabular-nums text-slate-900 group-hover:text-amber-600 transition-colors flex items-baseline gap-1">
                {stats.biggestExpense.amount.toLocaleString()}
                <span className="text-[10px] opacity-40 font-bold">ETB</span>
              </p>
              <p className="text-[9px] font-black text-slate-400 uppercase tracking-widest mt-0.5">
                {stats.biggestExpense.category}
              </p>
            </div>
          </div>
        </motion.div>

        {/* Recent Transactions List */}
        <motion.div variants={itemVariants} className="space-y-3">
          <div className="flex items-center justify-between px-1">
            <h3 className="text-base font-black tracking-tight text-slate-900">
              Recent Transactions
            </h3>
            <Link
              href="/transactions"
              className="text-teal-600 text-[9px] font-black uppercase tracking-widest hover:underline flex items-center gap-1"
            >
              See all <ChevronRight className="w-3 h-3" />
            </Link>
          </div>

          <div className="space-y-1">
            {recentTransactions.length > 0 ? (
              recentTransactions.map((tx: any) => (
                <div
                  key={tx.id}
                  className="flex items-center justify-between p-3.5 bg-white border border-slate-50 hover:border-slate-100 hover:shadow-sm rounded-xl transition-all group"
                >
                  <div className="flex items-center gap-2.5">
                    <div className="w-10 h-10 bg-slate-100/50 rounded-lg flex items-center justify-center text-lg group-hover:scale-110 transition-transform">
                      {tx.category?.icon || "📁"}
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 tracking-tight">
                        {tx.category?.name === "Transfer" 
                          ? tx.description 
                          : tx.description}
                      </p>
                      <p className="text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-0.5">
                        {tx.category?.name === "Transfer" 
                          ? (tx.type === "INCOME" ? "Deposit" : "Withdrawal")
                          : tx.category?.name}
                      </p>
                    </div>
                  </div>
                  <p
                    className={`font-black tracking-tight tabular-nums text-sm ${
                      tx.category?.name === "Transfer" 
                        ? (tx.type === "EXPENSE" ? "text-amber-600" : "text-indigo-600")
                        : tx.type === "EXPENSE" 
                          ? "text-rose-600" 
                          : "text-emerald-600"
                    }`}
                  >
                    {tx.category?.name === "Transfer" ? "" : (tx.type === "EXPENSE" ? "-" : "+")}{" "}
                    {tx.amount.toLocaleString()}
                    <span className="text-[7px] ml-1 uppercase opacity-40 font-bold">
                      ETB
                    </span>
                  </p>
                </div>
              ))
            ) : (
              <div className="text-center py-6 glass rounded-[1.5rem] opacity-50">
                <p className="text-slate-400 text-[10px] font-bold italic tracking-wide">
                  No recent transactions to display
                </p>
              </div>
            )}
          </div>
        </motion.div>

      </motion.div>
    </div>
  );
}
