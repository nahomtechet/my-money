"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { GlassCard } from "@/components/ui/glass-card";
import {
  User,
  Bell,
  Lock,
  ChevronLeft,
  Camera,
  Shield,
  Globe,
  Moon,
  Loader2,
  Check,
  CreditCard,
  Building2,
  Wallet,
  Send,
  LogOut,
  Copy,
} from "lucide-react";
import Link from "next/link"
import { signOut } from "next-auth/react";

export default function SettingsPage() {
  const [activeTab, setActiveTab] = useState("profile");
  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveSuccess, setSaveSuccess] = useState(false);
  const [formData, setFormData] = useState({
    name: "",
    email: "",
    pushEnabled: false,
    budgetRemindersEnabled: true,
    telegramUsername: "",
    telegramVerificationCode: "",
    telegramId: "",
  });
  const [copied, setCopied] = useState(false);

  const handleCopyCode = (code: string) => {
    navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  useEffect(() => {
    const fetchProfile = async () => {
      try {
        const res = await fetch("/api/user/profile");
        if (res.ok) {
          const data = await res.json();
          setFormData({
            name: data.name || "",
            email: data.email || "",
            pushEnabled: data.pushEnabled || false,
            budgetRemindersEnabled: data.budgetRemindersEnabled ?? true,
            telegramUsername: data.telegramUsername || "",
            telegramVerificationCode: data.telegramVerificationCode || "",
            telegramId: data.telegramId || "",
          });
        }
      } catch (error) {
        console.error("Failed to fetch profile:", error);
      } finally {
        setIsLoading(false);
      }
    };
    fetchProfile();
  }, []);

  // Poll for telegram status updates when user has code but not linked yet
  useEffect(() => {
    if (!formData.telegramVerificationCode || formData.telegramId) {
      return; // Don't poll if no code or already linked
    }

    const pollTelegramStatus = async () => {
      try {
        const res = await fetch("/api/telegram/status");
        if (res.ok) {
          const data = await res.json();
          // If we got a telegramId when we didn't have one before, update!
          if (data.telegramId && !formData.telegramId) {
            setFormData((prev) => ({
              ...prev,
              telegramId: data.telegramId,
              telegramVerificationCode: data.telegramVerificationCode,
            }));
          }
        }
      } catch (error) {
        console.error("Failed to poll telegram status:", error);
      }
    };

    // Poll every 3 seconds
    const interval = setInterval(pollTelegramStatus, 3000);
    return () => clearInterval(interval);
  }, [formData.telegramVerificationCode, formData.telegramId]);

  const handleSave = async (updatedData?: any) => {
    setIsSaving(true);
    setSaveSuccess(false);
    const dataToSave = updatedData || formData;
    try {
      const res = await fetch("/api/user/profile", {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(dataToSave),
      });
      if (res.ok) {
        const data = await res.json();
        if (data.user) {
          setFormData((prev) => ({
            ...prev,
            ...data.user,
          }));
        }
        setSaveSuccess(true);
        setTimeout(() => setSaveSuccess(false), 3000);
      }
    } catch (error) {
      console.error("Save failed:", error);
    } finally {
      setIsSaving(false);
    }
  };

  const togglePush = async () => {
    const newValue = !formData.pushEnabled;
    setFormData((prev) => ({ ...prev, pushEnabled: newValue }));

    if (newValue) {
      try {
        const { registerPush } = await import("@/lib/push-registration");
        await registerPush();
      } catch (error) {
        console.error("Push registration failed:", error);
        setFormData((prev) => ({ ...prev, pushEnabled: false }));
        alert(
          "Failed to enable push notifications. Please check browser permissions.",
        );
      }
    }

    // Save immediately when toggled
    handleSave({ ...formData, pushEnabled: newValue });
  };

  const toggleBudgetReminders = () => {
    const newValue = !formData.budgetRemindersEnabled;
    setFormData((prev) => ({ ...prev, budgetRemindersEnabled: newValue }));
    handleSave({ ...formData, budgetRemindersEnabled: newValue });
  };

  const containerVariants = {
    hidden: { opacity: 0 },
    show: {
      opacity: 1,
      transition: { staggerChildren: 0.1 },
    },
  };

  const itemVariants = {
    hidden: { opacity: 0, y: 10 },
    show: { opacity: 1, y: 0 },
  };

  const ETHIOPIAN_BANKS = [
    "Abay Bank",
    "Addis International Bank",
    "Awash International Bank",
    "Bank of Abyssinia",
    "Berhan International Bank",
    "Bunna International Bank",
    "Commercial Bank of Ethiopia (CBE)",
    "Cooperative Bank of Oromia",
    "Dashen Bank",
    "Debub Global Bank",
    "Enat Bank",
    "Hibret Bank",
    "Lion International Bank",
    "Nib International Bank",
    "Oromia Bank",
    "Wegagen Bank",
    "Zemen Bank",
  ];

  const [accounts, setAccounts] = useState<any[]>([]);
  const [newAccount, setNewAccount] = useState({
    name: ETHIOPIAN_BANKS[0],
    type: "BANK",
    accountNumber: "",
    phoneNumber: "",
  });

  useEffect(() => {
    const fetchAccounts = async () => {
      try {
        const res = await fetch("/api/accounts");
        if (res.ok) {
          const data = await res.json();
          setAccounts(data);
        }
      } catch (error) {
        console.error("Failed to fetch accounts:", error);
      }
    };
    fetchAccounts();
  }, []);

  const handleAddAccount = async () => {
    if (!newAccount.name) {
      alert("Account name is required");
      return;
    }

    try {
      const res = await fetch("/api/accounts", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(newAccount),
      });
      if (res.ok) {
        const saved = await res.json();
        setAccounts((prev) => [saved, ...prev]);
        setNewAccount({
          name: newAccount.type === "BANK" ? ETHIOPIAN_BANKS[0] : "Telebirr",
          type: newAccount.type,
          accountNumber: "",
          phoneNumber: "",
        });
      } else {
        const errorData = await res.json();
        alert(`Error: ${errorData.error || "Failed to add account"}`);
        console.error("Add account failed:", errorData);
      }
    } catch (error) {
      console.error("Failed to add account:", error);
    }
  };

  const tabs = [
    { id: "profile", label: "Profile", icon: User },
    { id: "accounts", label: "Accounts", icon: CreditCard },
    { id: "notifications", label: "Notifications", icon: Bell },
    { id: "security", label: "Security", icon: Lock },
    { id: "appearance", label: "Appearance", icon: Moon },
  ];

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-white">
        <Loader2 className="w-8 h-8 text-teal-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white text-slate-900 pb-12">
      <motion.div
        variants={containerVariants}
        initial="hidden"
        animate="show"
        className="max-w-2xl mx-auto px-6 pt-6 space-y-6"
      >
        {/* Header */}
        <motion.div
          variants={itemVariants}
          className="flex items-center justify-between"
        >
          <div className="flex items-center gap-4">
            <Link
              href="/"
              className="w-9 h-9 flex items-center justify-center rounded-full bg-slate-50 border border-slate-100 hover:bg-slate-100 transition-colors"
            >
              <ChevronLeft className="w-5 h-5 text-slate-600" />
            </Link>
            <h1 className="text-xl font-black tracking-tight text-slate-900">
              Settings
            </h1>
          </div>

          <button
            onClick={handleSave}
            disabled={isSaving}
            className={`flex items-center gap-2 px-5 py-2 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
              saveSuccess
                ? "bg-emerald-500 text-white"
                : "bg-[#008080] text-white hover:scale-105 shadow-lg shadow-teal-900/10"
            } disabled:opacity-50`}
          >
            {isSaving ? (
              <Loader2 className="w-3.5 h-3.5 animate-spin" />
            ) : saveSuccess ? (
              <Check className="w-3.5 h-3.5" />
            ) : null}
            <span>
              {saveSuccess
                ? "Changes Saved"
                : isSaving
                  ? "Saving..."
                  : "Save Changes"}
            </span>
          </button>
        </motion.div>

        {/* Tabs */}
        <motion.div
          variants={itemVariants}
          className="flex p-1 bg-slate-100/50 rounded-2xl"
        >
          {tabs.map((tab) => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex-1 flex items-center justify-center gap-2 py-2.5 rounded-xl text-[10px] font-black uppercase tracking-widest transition-all ${
                activeTab === tab.id
                  ? "bg-white text-teal-600 shadow-sm"
                  : "text-slate-400 hover:text-slate-600"
              }`}
            >
              <tab.icon className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">{tab.label}</span>
            </button>
          ))}
        </motion.div>

        {/* Sections */}
        <AnimatePresence mode="wait">
          {activeTab === "accounts" && (
            <motion.div
              key="accounts"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Add New Account
                </h4>
                <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-4">
                  <div className="grid grid-cols-2 gap-3">
                    <div className="space-y-1.5">
                      <label className="px-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        Type
                      </label>
                      <select
                        value={newAccount.type}
                        onChange={(e) => {
                          const type = e.target.value;
                          setNewAccount((prev) => ({
                            ...prev,
                            type,
                            name:
                              type === "BANK" ? ETHIOPIAN_BANKS[0] : "Telebirr",
                          }));
                        }}
                        className="w-full h-11 px-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none"
                      >
                        <option value="BANK">Bank Account</option>
                        <option value="MOBILE_MONEY">
                          Mobile Money (Telebirr)
                        </option>
                      </select>
                    </div>
                    <div className="space-y-1.5">
                      <label className="px-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                        {newAccount.type === "BANK"
                          ? "Account Number"
                          : "Phone Number"}
                      </label>
                      <input
                        type="text"
                        value={
                          newAccount.type === "BANK"
                            ? newAccount.accountNumber
                            : newAccount.phoneNumber
                        }
                        onChange={(e) =>
                          setNewAccount((prev) => ({
                            ...prev,
                            [newAccount.type === "BANK"
                              ? "accountNumber"
                              : "phoneNumber"]: e.target.value,
                          }))
                        }
                        className="w-full h-11 px-3 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none"
                        placeholder={
                          newAccount.type === "BANK"
                            ? "e.g. 1000..."
                            : "e.g. 09..."
                        }
                      />
                    </div>
                  </div>
                  <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      {newAccount.type === "BANK"
                        ? "Bank Name"
                        : "Account Identity"}
                    </label>
                    <div className="flex gap-2">
                      {newAccount.type === "BANK" ? (
                        <select
                          value={newAccount.name}
                          onChange={(e) =>
                            setNewAccount((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="flex-1 h-11 px-4 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none"
                        >
                          {ETHIOPIAN_BANKS.map((bank) => (
                            <option key={bank} value={bank}>
                              {bank}
                            </option>
                          ))}
                        </select>
                      ) : (
                        <input
                          type="text"
                          value={newAccount.name}
                          onChange={(e) =>
                            setNewAccount((prev) => ({
                              ...prev,
                              name: e.target.value,
                            }))
                          }
                          className="flex-1 h-11 px-4 bg-white border border-slate-100 rounded-xl text-xs font-bold text-slate-700 outline-none"
                          placeholder="e.g. Telebirr"
                          readOnly={newAccount.type === "MOBILE_MONEY"}
                        />
                      )}
                      <button
                        onClick={handleAddAccount}
                        className="px-6 bg-teal-600 text-white rounded-xl text-[10px] font-black uppercase tracking-widest hover:bg-teal-700 transition-all hover:scale-105 active:scale-95"
                      >
                        Add
                      </button>
                    </div>
                  </div>
                </div>
              </div>

              <div className="space-y-3">
                <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Your Accounts
                </h4>
                <div className="grid gap-2">
                  {accounts.length > 0 ? (
                    accounts.map((acc) => (
                      <section
                        key={acc.id}
                        className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-200 transition-colors"
                      >
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                            {acc.type === "BANK" ? (
                              <Building2 className="w-5 h-5 text-slate-400" />
                            ) : (
                              <Wallet className="w-5 h-5 text-slate-400" />
                            )}
                          </div>
                          <div>
                            <p className="text-xs font-black text-slate-800 tracking-tight">
                              {acc.name}
                            </p>
                            <p className="text-[10px] font-bold text-slate-400 uppercase">
                              {acc.type === "BANK"
                                ? `Bank • ${acc.accountNumber || "No No."}`
                                : `Mobile • ${acc.phoneNumber || "No No."}`}
                            </p>
                          </div>
                        </div>
                        <div className="text-right">
                          <p className="text-[9px] font-bold text-emerald-500 uppercase tracking-widest">
                            Active
                          </p>
                        </div>
                      </section>
                    ))
                  ) : (
                    <div className="text-center py-8 bg-slate-50/50 border border-dashed border-slate-200 rounded-3xl">
                      <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                        No accounts added yet
                      </p>
                    </div>
                  )}
                </div>
              </div>
            </motion.div>
          )}

          {activeTab === "profile" && (
            <motion.div
              key="profile"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <GlassCard className="p-6 border-slate-100/60 shadow-lg bg-white/80 rounded-[1.5rem] flex flex-col items-center">
                <div className="relative group">
                  <div className="w-24 h-24 rounded-full bg-slate-100 border-4 border-white shadow-xl flex items-center justify-center overflow-hidden">
                    <User className="w-12 h-12 text-slate-300" />
                  </div>
                  <button className="absolute bottom-0 right-0 p-2 bg-teal-500 rounded-full text-white shadow-lg translate-x-1 translate-y-1 hover:scale-110 transition-transform">
                    <Camera className="w-4 h-4" />
                  </button>
                </div>
                <div className="text-center mt-4">
                  <h3 className="text-lg font-black tracking-tight">
                    {formData.name || "User"}
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase tracking-widest">
                    Premium Member
                  </p>
                </div>
              </GlassCard>

              <div className="space-y-3">
                <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  General Information
                </h4>
                <div className="space-y-4">
                  <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Full Name
                    </label>
                    <input
                      type="text"
                      value={formData.name}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          name: e.target.value,
                        }))
                      }
                      className="w-full h-12 px-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="Full Name"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Email Address
                    </label>
                    <input
                      type="email"
                      value={formData.email}
                      onChange={(e) =>
                        setFormData((prev) => ({
                          ...prev,
                          email: e.target.value,
                        }))
                      }
                      className="w-full h-12 px-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300"
                      placeholder="email@example.com"
                    />
                  </div>

                  <div className="space-y-1.5">
                    <label className="px-1 text-[9px] font-black text-slate-500 uppercase tracking-widest">
                      Telegram Username
                    </label>
                    <div className="relative">
                      <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-bold text-sm">
                        @
                      </span>
                      <input
                        type="text"
                        value={formData.telegramUsername}
                        onChange={(e) =>
                          setFormData((prev) => ({
                            ...prev,
                            telegramUsername: e.target.value.replace("@", ""),
                          }))
                        }
                        className="w-full h-12 pl-8 pr-4 bg-white border border-slate-100 rounded-2xl text-sm font-bold text-slate-700 focus:ring-2 focus:ring-teal-500/20 focus:border-teal-500 outline-none transition-all placeholder:text-slate-300"
                        placeholder="username"
                      />
                    </div>
                    <p className="px-1 text-[8px] font-bold text-slate-400 uppercase tracking-widest mt-1">
                      Used for Equb payment reminders
                    </p>
                  </div>
                </div>
              </div>

              {formData.telegramUsername && (
                <div className="space-y-3 pt-2">
                  <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                    Telegram Verification
                  </h4>
                  <div className="p-4 bg-slate-50/50 border border-slate-100 rounded-3xl space-y-3">
                    {formData.telegramId ? (
                      <div className="flex items-center gap-3">
                        <div className="w-8 h-8 rounded-lg bg-emerald-50 flex items-center justify-center">
                          <Check className="w-4 h-4 text-emerald-500" />
                        </div>
                        <div>
                          <p className="text-[10px] font-black text-slate-800 uppercase tracking-tight">
                            Verified & Connected
                          </p>
                          <p className="text-[9px] font-bold text-slate-400 uppercase">
                            Your account is linked to Telegram
                          </p>
                        </div>
                      </div>
                    ) : (
                      <>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[10px] font-black text-amber-600">
                            1
                          </div>
                          <p className="text-[10px] font-bold text-slate-600 leading-normal">
                            Open{" "}
                            <Link
                              href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "EqubReminderBot"}`}
                              target="_blank"
                              className="text-[#0088cc] hover:underline font-black"
                            >
                              @
                              {process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME ||
                                "EqubReminderBot"}
                            </Link>{" "}
                            on Telegram.
                          </p>
                        </div>
                        <div className="flex items-center gap-3">
                          <div className="w-8 h-8 rounded-lg bg-amber-50 flex items-center justify-center text-[10px] font-black text-amber-600">
                            2
                          </div>
                          <div className="flex-1">
                            <p className="text-[10px] font-bold text-slate-600 leading-normal">
                              Send this 6-digit code to the bot:
                            </p>
                            <div className="mt-2 flex items-center gap-2">
                              <div className="px-4 py-2 bg-white border-2 border-dashed border-amber-200 rounded-xl text-lg font-black tracking-[0.3em] text-amber-600 shadow-sm">
                                {formData.telegramVerificationCode || "------"}
                              </div>
                              <button
                                onClick={() => handleCopyCode(formData.telegramVerificationCode)}
                                className={`p-2.5 rounded-xl border transition-all ${
                                  copied 
                                    ? "bg-emerald-50 border-emerald-100 text-emerald-500" 
                                    : "bg-white border-slate-100 text-slate-400 hover:text-teal-600 hover:border-teal-100 shadow-sm"
                                }`}
                                title="Copy Verification Code"
                              >
                                {copied ? (
                                  <Check className="w-4 h-4" />
                                ) : (
                                  <Copy className="w-4 h-4" />
                                )}
                              </button>
                            </div>
                          </div>
                        </div>
                      </>
                    )}
                  </div>
                </div>
              )}
            </motion.div>
          )}

          {activeTab === "notifications" && (
            <motion.div
              key="notifications"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Preferences
              </h4>
              <div className="space-y-2">
                <section className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-200 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                      <Bell className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 tracking-tight">
                        Push Alerts
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        Real-time alerts for large transactions
                      </p>
                    </div>
                  </div>
                  <button
                    onClick={togglePush}
                    className={`w-10 h-6 rounded-full relative p-1 transition-colors ${formData.pushEnabled ? "bg-teal-500" : "bg-slate-200"}`}
                  >
                    <motion.div
                      animate={{ x: formData.pushEnabled ? 16 : 0 }}
                      className="w-4 h-4 bg-white rounded-full shadow-sm"
                    />
                  </button>
                </section>

                <section className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-200 transition-colors text-left">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-[#0088cc]/10 rounded-xl flex items-center justify-center">
                      <Send className="w-5 h-5 text-[#0088cc]" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 tracking-tight">
                        Telegram Setup
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        {formData.telegramUsername
                          ? `Linked to @${formData.telegramUsername}`
                          : "Not linked yet"}
                      </p>
                    </div>
                  </div>
                  <Link
                    href={`https://t.me/${process.env.NEXT_PUBLIC_TELEGRAM_BOT_USERNAME || "EqubReminderBot"}?start=${formData.telegramUsername}`}
                    target="_blank"
                    className="text-[9px] font-black text-[#0088cc] uppercase tracking-widest hover:underline"
                  >
                    Link Bot
                  </Link>
                </section>
              </div>
            </motion.div>
          )}

          {activeTab === "security" && (
            <motion.div
              key="security"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-6"
            >
              <div className="space-y-3">
                <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Security Settings
                </h4>
                <div className="space-y-2">
                  <section className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-emerald-50 rounded-xl flex items-center justify-center">
                        <Shield className="w-5 h-5 text-emerald-500" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 tracking-tight">
                          Two-Factor Authentication
                        </p>
                        <p className="text-[10px] font-bold text-emerald-500 uppercase">
                          Enabled
                        </p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">
                      Manage
                    </button>
                  </section>

                  <section className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between group hover:border-slate-200 transition-colors">
                    <div className="flex items-center gap-3">
                      <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                        <Lock className="w-5 h-5 text-slate-400" />
                      </div>
                      <div>
                        <p className="text-xs font-black text-slate-800 tracking-tight">
                          Password
                        </p>
                        <p className="text-[10px] font-bold text-slate-400 uppercase">
                          Last changed 3 months ago
                        </p>
                      </div>
                    </div>
                    <button className="text-[10px] font-black text-teal-600 uppercase tracking-widest hover:underline">
                      Change
                    </button>
                  </section>
                </div>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                  Account Actions
                </h4>
                <button
                  onClick={() => signOut({ callbackUrl: "/auth/signin" })}
                  className="w-full p-4 bg-slate-50 border border-slate-100 rounded-2xl flex items-center justify-center gap-2 group hover:bg-slate-100 transition-colors"
                >
                  <LogOut className="w-4 h-4 text-slate-600" />
                  <span className="text-[10px] font-black text-slate-600 uppercase tracking-[0.2em]">
                    Log Out
                  </span>
                </button>
              </div>

              <div className="space-y-3 pt-2">
                <h4 className="px-1 text-[9px] font-black text-rose-400 uppercase tracking-[0.2em]">
                  Danger Zone
                </h4>
                <button className="w-full p-4 bg-rose-50 border border-rose-100 rounded-2xl flex items-center justify-center gap-2 group hover:bg-rose-100 transition-colors">
                  <span className="text-[10px] font-black text-rose-600 uppercase tracking-[0.2em]">
                    Delete Account Permanently
                  </span>
                </button>
              </div>
            </motion.div>
          )}

          {activeTab === "appearance" && (
            <motion.div
              key="appearance"
              initial={{ opacity: 0, x: -10 }}
              animate={{ opacity: 1, x: 0 }}
              exit={{ opacity: 0, x: 10 }}
              className="space-y-3"
            >
              <h4 className="px-1 text-[9px] font-black text-slate-400 uppercase tracking-[0.2em]">
                Customization
              </h4>
              <div className="space-y-4">
                <GlassCard className="p-6 border-slate-100/60 bg-slate-50/50 rounded-2xl flex flex-col items-center text-center">
                  <Moon className="w-12 h-12 text-slate-300 mb-4" />
                  <h3 className="text-sm font-black text-slate-800 tracking-tight">
                    Coming Soon: Dark Mode
                  </h3>
                  <p className="text-[10px] font-bold text-slate-400 uppercase mt-1 leading-relaxed">
                    We&apos;re working on a beautiful dark experience
                    <br />
                    to help you track your money at night.
                  </p>
                </GlassCard>

                <section className="p-4 bg-white border border-slate-100 rounded-2xl flex items-center justify-between opacity-50">
                  <div className="flex items-center gap-3">
                    <div className="w-10 h-10 bg-slate-50 rounded-xl flex items-center justify-center">
                      <Globe className="w-5 h-5 text-slate-400" />
                    </div>
                    <div>
                      <p className="text-xs font-black text-slate-800 tracking-tight">
                        Language
                      </p>
                      <p className="text-[10px] font-bold text-slate-400 uppercase">
                        English (US)
                      </p>
                    </div>
                  </div>
                  <span className="text-[9px] font-black text-slate-300 uppercase tracking-widest border border-slate-200 px-2 py-1 rounded-md">
                    Locked
                  </span>
                </section>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
