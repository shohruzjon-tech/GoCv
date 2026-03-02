"use client";

import { useState, useEffect, Fragment } from "react";
import { useAuthStore } from "@/lib/store";
import { authApi, uploadApi } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import { motion, AnimatePresence } from "framer-motion";
import {
  Settings,
  User,
  CreditCard,
  Camera,
  Loader2,
  Key,
  Shield,
  Bell,
  Globe,
  Monitor,
  Smartphone,
  MapPin,
  Link2,
  Github,
  Linkedin,
  X,
  Check,
  Edit3,
  Lock,
  Trash2,
  AlertTriangle,
  Sparkles,
  Zap,
  Mail,
  UserCircle,
  Fingerprint,
  Languages,
  Clock,
  LogOut,
} from "lucide-react";

/* ─── Animated Modal ─── */
function Modal({
  open,
  onClose,
  title,
  children,
}: {
  open: boolean;
  onClose: () => void;
  title: string;
  children: React.ReactNode;
}) {
  useEffect(() => {
    if (open) document.body.style.overflow = "hidden";
    else document.body.style.overflow = "";
    return () => {
      document.body.style.overflow = "";
    };
  }, [open]);

  return (
    <AnimatePresence>
      {open && (
        <Fragment>
          <motion.div
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            exit={{ opacity: 0 }}
            transition={{ duration: 0.2 }}
            className="fixed inset-0 z-50 bg-black/60 backdrop-blur-sm"
            onClick={onClose}
          />
          <motion.div
            initial={{ opacity: 0, scale: 0.95, y: 20 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95, y: 20 }}
            transition={{ type: "spring", stiffness: 400, damping: 30 }}
            className="fixed inset-x-4 top-[10%] z-50 mx-auto max-w-lg overflow-hidden rounded-2xl border border-white/10 bg-gradient-to-b from-[#141428]/95 to-[#0c0c20]/95 shadow-2xl shadow-indigo-500/10 backdrop-blur-xl sm:inset-x-auto"
          >
            <div className="flex items-center justify-between border-b border-white/5 px-6 py-4">
              <h2 className="text-lg font-semibold text-content">{title}</h2>
              <button
                onClick={onClose}
                className="rounded-lg p-1.5 text-content-3 transition hover:bg-white/5 hover:text-content"
              >
                <X className="h-5 w-5" />
              </button>
            </div>
            <div className="max-h-[70vh] overflow-y-auto px-6 py-5">
              {children}
            </div>
          </motion.div>
        </Fragment>
      )}
    </AnimatePresence>
  );
}

/* ─── Glassmorphism Card ─── */
function GlassCard({
  children,
  className = "",
  glow,
}: {
  children: React.ReactNode;
  className?: string;
  glow?: string;
}) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 16 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4, ease: "easeOut" }}
      className={`relative overflow-hidden rounded-2xl border border-white/[0.06] bg-gradient-to-br from-white/[0.04] to-white/[0.01] p-6 backdrop-blur-md ${className}`}
    >
      {glow && (
        <div
          className={`pointer-events-none absolute -top-20 -right-20 h-40 w-40 rounded-full blur-3xl opacity-20 ${glow}`}
        />
      )}
      <div className="relative">{children}</div>
    </motion.div>
  );
}

/* ─── Floating Input ─── */
function FloatingInput({
  label,
  value,
  onChange,
  placeholder,
  type = "text",
  icon: Icon,
}: {
  label: string;
  value: string;
  onChange: (v: string) => void;
  placeholder?: string;
  type?: string;
  icon?: any;
}) {
  return (
    <div className="group">
      <label className="mb-1.5 block text-xs font-medium text-content-3 transition group-focus-within:text-indigo-400">
        {label}
      </label>
      <div className="relative">
        {Icon && (
          <Icon className="absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4 transition group-focus-within:text-indigo-400" />
        )}
        <input
          type={type}
          value={value}
          onChange={(e) => onChange(e.target.value)}
          placeholder={placeholder}
          className={`w-full rounded-xl border border-white/[0.06] bg-white/[0.03] py-2.5 text-sm text-content placeholder-content-4 outline-none transition focus:border-indigo-500/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/20 ${
            Icon ? "pl-10 pr-4" : "px-4"
          }`}
        />
      </div>
    </div>
  );
}

/* ─── Settings Row ─── */
function SettingsRow({
  icon: Icon,
  label,
  value,
  action,
  iconColor = "text-content-3",
}: {
  icon: any;
  label: string;
  value?: string | React.ReactNode;
  action?: React.ReactNode;
  iconColor?: string;
}) {
  return (
    <div className="flex items-center justify-between gap-4 py-3.5">
      <div className="flex items-center gap-3.5 min-w-0">
        <div
          className={`flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-white/[0.04] ${iconColor}`}
        >
          <Icon className="h-4 w-4" />
        </div>
        <div className="min-w-0">
          <p className="text-sm font-medium text-content">{label}</p>
          {value && (
            <p className="mt-0.5 truncate text-xs text-content-3">{value}</p>
          )}
        </div>
      </div>
      {action && <div className="shrink-0">{action}</div>}
    </div>
  );
}

/* ═══════════════════════════════════════ */
/* MAIN PAGE                              */
/* ═══════════════════════════════════════ */
export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();

  // Profile fields
  const [name, setName] = useState(user?.name || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || "");
  const [github, setGithub] = useState(user?.socialLinks?.github || "");
  const [twitter, setTwitter] = useState(user?.socialLinks?.twitter || "");

  // Modals
  const [editProfileOpen, setEditProfileOpen] = useState(false);
  const [editSocialOpen, setEditSocialOpen] = useState(false);
  const [changePasswordOpen, setChangePasswordOpen] = useState(false);
  const [preferencesOpen, setPreferencesOpen] = useState(false);
  const [sessionsOpen, setSessionsOpen] = useState(false);
  const [deleteAccountOpen, setDeleteAccountOpen] = useState(false);

  // Password
  const [currentPassword, setCurrentPassword] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [showPassword, setShowPassword] = useState(false);

  // Preferences
  const [emailNotifications, setEmailNotifications] = useState(
    user?.preferences?.emailNotifications ?? true,
  );
  const [marketingEmails, setMarketingEmails] = useState(
    user?.preferences?.marketingEmails ?? false,
  );
  const [language, setLanguage] = useState(user?.preferences?.language || "en");
  const [timezone, setTimezone] = useState(
    user?.preferences?.timezone ||
      Intl.DateTimeFormat().resolvedOptions().timeZone,
  );

  // Sessions
  const [sessions, setSessions] = useState<any[]>([]);
  const [sessionsLoading, setSessionsLoading] = useState(false);

  // Loading states
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [savingPreferences, setSavingPreferences] = useState(false);
  const [deletePassword, setDeletePassword] = useState("");

  // Sync when user changes
  useEffect(() => {
    if (user) {
      setName(user.name || "");
      setHeadline(user.headline || "");
      setBio(user.bio || "");
      setLocation(user.location || "");
      setWebsite(user.website || "");
      setLinkedin(user.socialLinks?.linkedin || "");
      setGithub(user.socialLinks?.github || "");
      setTwitter(user.socialLinks?.twitter || "");
      setEmailNotifications(user.preferences?.emailNotifications ?? true);
      setMarketingEmails(user.preferences?.marketingEmails ?? false);
    }
  }, [user]);

  /* ─── Handlers ─── */

  const handleSaveProfile = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        name,
        headline,
        bio,
        location,
        website,
        socialLinks: { linkedin, github, twitter },
      });
      updateUser(res.data);
      toast.success("Profile updated!");
      setEditProfileOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleSaveSocial = async () => {
    setSaving(true);
    try {
      const res = await authApi.updateProfile({
        socialLinks: { linkedin, github, twitter },
      });
      updateUser(res.data);
      toast.success("Social links updated!");
      setEditSocialOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleAvatarUpload = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;
    setUploading(true);
    try {
      const res = await uploadApi.uploadImage(file);
      updateUser({ avatar: res.data.url });
      toast.success("Avatar updated!");
    } catch {
      toast.error("Upload failed");
    } finally {
      setUploading(false);
    }
  };

  const handleChangePassword = async () => {
    if (newPassword !== confirmPassword) {
      toast.error("Passwords don't match");
      return;
    }
    if (newPassword.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }
    setChangingPassword(true);
    try {
      await authApi.changePassword(currentPassword, newPassword);
      toast.success("Password changed!");
      setChangePasswordOpen(false);
      setCurrentPassword("");
      setNewPassword("");
      setConfirmPassword("");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to change password");
    } finally {
      setChangingPassword(false);
    }
  };

  const handleSavePreferences = async () => {
    setSavingPreferences(true);
    try {
      const prefs = await authApi.updatePreferences({
        emailNotifications,
        marketingEmails,
        language,
        timezone,
      });
      updateUser({ preferences: prefs.data });
      toast.success("Preferences saved!");
      setPreferencesOpen(false);
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSavingPreferences(false);
    }
  };

  const loadSessions = async () => {
    setSessionsLoading(true);
    try {
      const res = await authApi.getSessions();
      setSessions(Array.isArray(res.data) ? res.data : []);
    } catch {
      toast.error("Failed to load sessions");
    } finally {
      setSessionsLoading(false);
    }
  };

  const handleTerminateSession = async (sessionId: string) => {
    try {
      await authApi.terminateSession(sessionId);
      setSessions(sessions.filter((s) => s._id !== sessionId));
      toast.success("Session terminated");
    } catch {
      toast.error("Failed to terminate session");
    }
  };

  const handleDeleteAccount = async () => {
    try {
      await authApi.deleteAccount(deletePassword || undefined);
      toast.success("Account deactivated");
      window.location.href = "/";
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete account");
    }
  };

  const parseUA = (ua?: string) => {
    if (!ua) return { browser: "Unknown", os: "Unknown" };
    const browser =
      ua.match(/(Chrome|Firefox|Safari|Edge|Opera)/i)?.[0] || "Browser";
    const os = ua.match(/(Windows|Mac|Linux|Android|iOS)/i)?.[0] || "OS";
    return { browser, os };
  };

  const memberSince = user?.createdAt
    ? new Date(user.createdAt).toLocaleDateString("en-US", {
        year: "numeric",
        month: "long",
        day: "numeric",
      })
    : "—";

  return (
    <div className="mx-auto max-w-4xl space-y-8 pb-12">
      {/* Header */}
      <motion.div
        initial={{ opacity: 0, y: -10 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        <h1 className="text-3xl font-bold tracking-tight text-content">
          <span className="bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400 bg-clip-text text-transparent">
            Settings
          </span>
        </h1>
        <p className="mt-1 text-sm text-content-3">
          Manage your profile, security, and preferences
        </p>
      </motion.div>

      {/* Nav Tabs */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.1 }}
        className="flex gap-1 rounded-2xl border border-white/[0.06] bg-white/[0.02] p-1.5 backdrop-blur-sm"
      >
        {[
          {
            href: "/dashboard/settings",
            label: "General",
            icon: Settings,
            active: true,
          },
          {
            href: "/dashboard/settings/billing",
            label: "Billing",
            icon: CreditCard,
            active: false,
          },
          {
            href: "/dashboard/settings/api-keys",
            label: "API Keys",
            icon: Key,
            active: false,
          },
        ].map((tab) => (
          <Link
            key={tab.href}
            href={tab.href}
            className={`flex items-center gap-2 rounded-xl px-4 py-2.5 text-sm font-medium transition-all ${
              tab.active
                ? "bg-white/[0.08] text-content shadow-sm shadow-indigo-500/10"
                : "text-content-3 hover:bg-white/[0.04] hover:text-content"
            }`}
          >
            <tab.icon className="h-4 w-4" />
            {tab.label}
          </Link>
        ))}
      </motion.div>

      {/* ─── Profile Card ─── */}
      <GlassCard glow="bg-indigo-500">
        <div className="flex flex-col gap-6 sm:flex-row sm:items-center">
          {/* Avatar */}
          <div className="relative shrink-0">
            <div className="relative h-24 w-24">
              {user?.avatar ? (
                <img
                  src={user.avatar}
                  alt=""
                  className="h-24 w-24 rounded-2xl object-cover ring-2 ring-white/10"
                />
              ) : (
                <div className="flex h-24 w-24 items-center justify-center rounded-2xl bg-gradient-to-br from-indigo-500/30 to-purple-500/30 text-3xl font-bold text-indigo-300 ring-2 ring-indigo-500/20">
                  {user?.name?.charAt(0)?.toUpperCase()}
                </div>
              )}
              <label className="absolute -bottom-2 -right-2 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg shadow-indigo-500/30 transition hover:scale-110 hover:bg-indigo-500">
                {uploading ? (
                  <Loader2 className="h-3.5 w-3.5 animate-spin" />
                ) : (
                  <Camera className="h-3.5 w-3.5" />
                )}
                <input
                  type="file"
                  accept="image/*"
                  onChange={handleAvatarUpload}
                  className="hidden"
                />
              </label>
            </div>
          </div>

          {/* Info */}
          <div className="flex-1 space-y-1">
            <h2 className="text-xl font-bold text-content">{user?.name}</h2>
            {user?.headline && (
              <p className="text-sm text-indigo-400">{user.headline}</p>
            )}
            <p className="text-xs text-content-3">{user?.email}</p>
            {user?.bio && (
              <p className="mt-2 text-sm leading-relaxed text-content-2">
                {user.bio}
              </p>
            )}
            <div className="flex flex-wrap gap-3 pt-2">
              {user?.location && (
                <span className="flex items-center gap-1.5 text-xs text-content-3">
                  <MapPin className="h-3 w-3" />
                  {user.location}
                </span>
              )}
              {user?.website && (
                <a
                  href={user.website}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="flex items-center gap-1.5 text-xs text-indigo-400 hover:text-indigo-300"
                >
                  <Link2 className="h-3 w-3" />
                  {user.website.replace(/https?:\/\//, "")}
                </a>
              )}
            </div>
          </div>

          {/* Edit */}
          <button
            onClick={() => setEditProfileOpen(true)}
            className="shrink-0 self-start rounded-xl border border-white/[0.08] bg-white/[0.04] px-4 py-2 text-sm font-medium text-content-2 transition hover:bg-white/[0.08] hover:text-content"
          >
            <Edit3 className="mr-1.5 inline h-3.5 w-3.5" />
            Edit Profile
          </button>
        </div>

        {/* Quick stats */}
        <div className="mt-6 grid grid-cols-2 gap-3 sm:grid-cols-4">
          {[
            { label: "Member since", value: memberSince, icon: Clock },
            {
              label: "Email",
              value: user?.isEmailVerified ? "Verified" : "Unverified",
              icon: Mail,
              color: user?.isEmailVerified
                ? "text-emerald-400"
                : "text-amber-400",
            },
            { label: "Role", value: user?.role || "user", icon: Shield },
            {
              label: "Social Links",
              value: `${[user?.socialLinks?.linkedin, user?.socialLinks?.github, user?.socialLinks?.twitter].filter(Boolean).length} connected`,
              icon: Globe,
            },
          ].map((stat) => (
            <div
              key={stat.label}
              className="rounded-xl border border-white/[0.04] bg-white/[0.02] px-3.5 py-3"
            >
              <div className="flex items-center gap-2">
                <stat.icon className="h-3.5 w-3.5 text-content-4" />
                <p className="text-[11px] font-medium uppercase tracking-wider text-content-4">
                  {stat.label}
                </p>
              </div>
              <p
                className={`mt-1 text-sm font-semibold capitalize ${stat.color || "text-content"}`}
              >
                {stat.value}
              </p>
            </div>
          ))}
        </div>
      </GlassCard>

      {/* ─── Social Links ─── */}
      <GlassCard glow="bg-purple-500">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-purple-500/10 text-purple-400">
              <Globe className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-content">
                Social Links
              </h3>
              <p className="text-xs text-content-3">
                Connect your social profiles
              </p>
            </div>
          </div>
          <button
            onClick={() => setEditSocialOpen(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
          >
            Edit
          </button>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <SettingsRow
            icon={Linkedin}
            label="LinkedIn"
            value={user?.socialLinks?.linkedin || "Not connected"}
            iconColor="text-blue-400"
          />
          <SettingsRow
            icon={Github}
            label="GitHub"
            value={user?.socialLinks?.github || "Not connected"}
            iconColor="text-content-2"
          />
          <SettingsRow
            icon={Globe}
            label="Twitter / X"
            value={user?.socialLinks?.twitter || "Not connected"}
            iconColor="text-sky-400"
          />
        </div>
      </GlassCard>

      {/* ─── Security ─── */}
      <GlassCard glow="bg-emerald-500">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-500/10 text-emerald-400">
            <Shield className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-content">Security</h3>
            <p className="text-xs text-content-3">Protect your account</p>
          </div>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <SettingsRow
            icon={Lock}
            label="Password"
            value="••••••••"
            iconColor="text-emerald-400"
            action={
              <button
                onClick={() => setChangePasswordOpen(true)}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
              >
                Change
              </button>
            }
          />
          <SettingsRow
            icon={Fingerprint}
            label="Two-Factor Authentication"
            value="Not enabled"
            iconColor="text-amber-400"
            action={
              <span className="rounded-full bg-amber-400/10 px-2.5 py-1 text-[10px] font-semibold text-amber-400">
                Coming Soon
              </span>
            }
          />
          <SettingsRow
            icon={Monitor}
            label="Active Sessions"
            value="Manage your active devices"
            iconColor="text-blue-400"
            action={
              <button
                onClick={() => {
                  setSessionsOpen(true);
                  loadSessions();
                }}
                className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
              >
                View
              </button>
            }
          />
        </div>
      </GlassCard>

      {/* ─── Preferences ─── */}
      <GlassCard glow="bg-sky-500">
        <div className="mb-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-sky-500/10 text-sky-400">
              <Bell className="h-5 w-5" />
            </div>
            <div>
              <h3 className="text-sm font-semibold text-content">
                Notifications & Preferences
              </h3>
              <p className="text-xs text-content-3">
                Customize your experience
              </p>
            </div>
          </div>
          <button
            onClick={() => setPreferencesOpen(true)}
            className="rounded-lg px-3 py-1.5 text-xs font-medium text-indigo-400 transition hover:bg-indigo-500/10"
          >
            Edit
          </button>
        </div>
        <div className="divide-y divide-white/[0.04]">
          <SettingsRow
            icon={Mail}
            label="Email Notifications"
            value={emailNotifications ? "Enabled" : "Disabled"}
            iconColor="text-sky-400"
            action={
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${emailNotifications ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-content-3"}`}
              >
                {emailNotifications ? "On" : "Off"}
              </span>
            }
          />
          <SettingsRow
            icon={Sparkles}
            label="Marketing Emails"
            value={marketingEmails ? "Subscribed" : "Unsubscribed"}
            iconColor="text-pink-400"
            action={
              <span
                className={`rounded-full px-2.5 py-1 text-[10px] font-semibold ${marketingEmails ? "bg-emerald-400/10 text-emerald-400" : "bg-white/5 text-content-3"}`}
              >
                {marketingEmails ? "On" : "Off"}
              </span>
            }
          />
          <SettingsRow
            icon={Languages}
            label="Language"
            value={language === "en" ? "English" : language}
            iconColor="text-violet-400"
          />
          <SettingsRow
            icon={Clock}
            label="Timezone"
            value={timezone}
            iconColor="text-orange-400"
          />
        </div>
      </GlassCard>

      {/* ─── Danger Zone ─── */}
      <GlassCard className="border-red-500/10">
        <div className="mb-4 flex items-center gap-3">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-red-500/10 text-red-400">
            <AlertTriangle className="h-5 w-5" />
          </div>
          <div>
            <h3 className="text-sm font-semibold text-red-400">Danger Zone</h3>
            <p className="text-xs text-content-3">Irreversible actions</p>
          </div>
        </div>
        <SettingsRow
          icon={Trash2}
          label="Delete Account"
          value="Permanently delete your account and all data"
          iconColor="text-red-400"
          action={
            <button
              onClick={() => setDeleteAccountOpen(true)}
              className="rounded-lg border border-red-500/20 px-3 py-1.5 text-xs font-medium text-red-400 transition hover:bg-red-500/10"
            >
              Delete
            </button>
          }
        />
      </GlassCard>

      {/* ═══════════════════════════════════ */}
      {/* MODALS                             */}
      {/* ═══════════════════════════════════ */}

      {/* Edit Profile */}
      <Modal
        open={editProfileOpen}
        onClose={() => setEditProfileOpen(false)}
        title="Edit Profile"
      >
        <div className="space-y-4">
          <FloatingInput
            label="Full Name"
            value={name}
            onChange={setName}
            icon={UserCircle}
          />
          <FloatingInput
            label="Headline"
            value={headline}
            onChange={setHeadline}
            placeholder="e.g. Full Stack Developer"
            icon={Zap}
          />
          <div className="group">
            <label className="mb-1.5 block text-xs font-medium text-content-3 transition group-focus-within:text-indigo-400">
              Bio
            </label>
            <textarea
              value={bio}
              onChange={(e) => setBio(e.target.value)}
              rows={3}
              placeholder="Tell us about yourself..."
              className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-content placeholder-content-4 outline-none transition focus:border-indigo-500/40 focus:bg-white/[0.05] focus:ring-1 focus:ring-indigo-500/20"
            />
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <FloatingInput
              label="Location"
              value={location}
              onChange={setLocation}
              placeholder="City, Country"
              icon={MapPin}
            />
            <FloatingInput
              label="Website"
              value={website}
              onChange={setWebsite}
              placeholder="https://..."
              icon={Link2}
            />
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setEditProfileOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-3 transition hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveProfile}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save Changes
            </button>
          </div>
        </div>
      </Modal>

      {/* Edit Social Links */}
      <Modal
        open={editSocialOpen}
        onClose={() => setEditSocialOpen(false)}
        title="Social Links"
      >
        <div className="space-y-4">
          <FloatingInput
            label="LinkedIn"
            value={linkedin}
            onChange={setLinkedin}
            placeholder="https://linkedin.com/in/..."
            icon={Linkedin}
          />
          <FloatingInput
            label="GitHub"
            value={github}
            onChange={setGithub}
            placeholder="https://github.com/..."
            icon={Github}
          />
          <FloatingInput
            label="Twitter / X"
            value={twitter}
            onChange={setTwitter}
            placeholder="https://twitter.com/..."
            icon={Globe}
          />
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setEditSocialOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-3 transition hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              onClick={handleSaveSocial}
              disabled={saving}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition hover:shadow-indigo-500/40 disabled:opacity-50"
            >
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save
            </button>
          </div>
        </div>
      </Modal>

      {/* Change Password */}
      <Modal
        open={changePasswordOpen}
        onClose={() => setChangePasswordOpen(false)}
        title="Change Password"
      >
        <div className="space-y-4">
          <FloatingInput
            label="Current Password"
            value={currentPassword}
            onChange={setCurrentPassword}
            type={showPassword ? "text" : "password"}
            icon={Lock}
          />
          <FloatingInput
            label="New Password"
            value={newPassword}
            onChange={setNewPassword}
            type={showPassword ? "text" : "password"}
            icon={Lock}
          />
          <FloatingInput
            label="Confirm New Password"
            value={confirmPassword}
            onChange={setConfirmPassword}
            type={showPassword ? "text" : "password"}
            icon={Lock}
          />
          <label className="flex items-center gap-2 text-xs text-content-3">
            <input
              type="checkbox"
              checked={showPassword}
              onChange={(e) => setShowPassword(e.target.checked)}
              className="rounded border-edge"
            />
            Show passwords
          </label>
          {newPassword && newPassword.length < 8 && (
            <p className="text-xs text-amber-400">
              Password must be at least 8 characters
            </p>
          )}
          {newPassword &&
            confirmPassword &&
            newPassword !== confirmPassword && (
              <p className="text-xs text-red-400">Passwords don&apos;t match</p>
            )}
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setChangePasswordOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-3 transition hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              onClick={handleChangePassword}
              disabled={
                changingPassword ||
                !newPassword ||
                newPassword !== confirmPassword ||
                newPassword.length < 8
              }
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {changingPassword ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Shield className="h-4 w-4" />
              )}
              Update Password
            </button>
          </div>
        </div>
      </Modal>

      {/* Preferences */}
      <Modal
        open={preferencesOpen}
        onClose={() => setPreferencesOpen(false)}
        title="Notifications & Preferences"
      >
        <div className="space-y-5">
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-3">
              Notifications
            </h4>
            <div className="space-y-3">
              {[
                {
                  icon: Mail,
                  color: "text-sky-400",
                  label: "Email Notifications",
                  desc: "Receive updates about your account",
                  checked: emailNotifications,
                  toggle: () => setEmailNotifications(!emailNotifications),
                },
                {
                  icon: Sparkles,
                  color: "text-pink-400",
                  label: "Marketing Emails",
                  desc: "Tips, product updates, and offers",
                  checked: marketingEmails,
                  toggle: () => setMarketingEmails(!marketingEmails),
                },
              ].map((item) => (
                <div
                  key={item.label}
                  className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                >
                  <div className="flex items-center gap-3">
                    <item.icon className={`h-4 w-4 ${item.color}`} />
                    <div>
                      <p className="text-sm font-medium text-content">
                        {item.label}
                      </p>
                      <p className="text-xs text-content-4">{item.desc}</p>
                    </div>
                  </div>
                  <button
                    onClick={item.toggle}
                    className={`relative h-6 w-11 rounded-full transition ${item.checked ? "bg-indigo-600" : "bg-white/10"}`}
                  >
                    <div
                      className={`absolute top-0.5 h-5 w-5 rounded-full bg-white shadow-sm transition-transform ${item.checked ? "translate-x-[22px]" : "translate-x-0.5"}`}
                    />
                  </button>
                </div>
              ))}
            </div>
          </div>
          <div>
            <h4 className="mb-3 text-xs font-semibold uppercase tracking-wider text-content-3">
              Localization
            </h4>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1.5 block text-xs font-medium text-content-3">
                  Language
                </label>
                <select
                  value={language}
                  onChange={(e) => setLanguage(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-content outline-none focus:border-indigo-500/40"
                >
                  <option value="en">English</option>
                  <option value="ru">Russian</option>
                  <option value="uz">Uzbek</option>
                  <option value="de">German</option>
                  <option value="fr">French</option>
                  <option value="es">Spanish</option>
                </select>
              </div>
              <div>
                <label className="mb-1.5 block text-xs font-medium text-content-3">
                  Timezone
                </label>
                <select
                  value={timezone}
                  onChange={(e) => setTimezone(e.target.value)}
                  className="w-full rounded-xl border border-white/[0.06] bg-white/[0.03] px-4 py-2.5 text-sm text-content outline-none focus:border-indigo-500/40"
                >
                  {[
                    "UTC",
                    "America/New_York",
                    "America/Chicago",
                    "America/Denver",
                    "America/Los_Angeles",
                    "Europe/London",
                    "Europe/Berlin",
                    "Europe/Moscow",
                    "Asia/Dubai",
                    "Asia/Tashkent",
                    "Asia/Tokyo",
                    "Australia/Sydney",
                  ].map((tz) => (
                    <option key={tz} value={tz}>
                      {tz.replace(/_/g, " ")}
                    </option>
                  ))}
                </select>
              </div>
            </div>
          </div>
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setPreferencesOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-3 transition hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              onClick={handleSavePreferences}
              disabled={savingPreferences}
              className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-indigo-500/25 transition disabled:opacity-50"
            >
              {savingPreferences ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Check className="h-4 w-4" />
              )}
              Save Preferences
            </button>
          </div>
        </div>
      </Modal>

      {/* Sessions */}
      <Modal
        open={sessionsOpen}
        onClose={() => setSessionsOpen(false)}
        title="Active Sessions"
      >
        <div className="space-y-3">
          {sessionsLoading ? (
            <div className="flex items-center justify-center py-8">
              <Loader2 className="h-6 w-6 animate-spin text-indigo-400" />
            </div>
          ) : sessions.filter((s) => s.isActive).length === 0 ? (
            <p className="py-8 text-center text-sm text-content-3">
              No active sessions found
            </p>
          ) : (
            sessions
              .filter((s) => s.isActive)
              .map((session) => {
                const { browser, os } = parseUA(session.userAgent);
                return (
                  <motion.div
                    key={session._id}
                    initial={{ opacity: 0, x: -10 }}
                    animate={{ opacity: 1, x: 0 }}
                    className="flex items-center justify-between rounded-xl border border-white/[0.06] bg-white/[0.02] p-3.5"
                  >
                    <div className="flex items-center gap-3">
                      <div className="flex h-9 w-9 items-center justify-center rounded-lg bg-white/[0.04]">
                        {os.match(/Android|iOS/i) ? (
                          <Smartphone className="h-4 w-4 text-content-3" />
                        ) : (
                          <Monitor className="h-4 w-4 text-content-3" />
                        )}
                      </div>
                      <div>
                        <p className="text-sm font-medium text-content">
                          {browser} on {os}
                        </p>
                        <p className="text-xs text-content-4">
                          {session.ipAddress || "Unknown IP"} •{" "}
                          {session.lastActivityAt
                            ? new Date(
                                session.lastActivityAt,
                              ).toLocaleDateString()
                            : "—"}
                        </p>
                      </div>
                    </div>
                    <button
                      onClick={() => handleTerminateSession(session._id)}
                      className="rounded-lg p-2 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Terminate session"
                    >
                      <LogOut className="h-4 w-4" />
                    </button>
                  </motion.div>
                );
              })
          )}
        </div>
      </Modal>

      {/* Delete Account */}
      <Modal
        open={deleteAccountOpen}
        onClose={() => setDeleteAccountOpen(false)}
        title="Delete Account"
      >
        <div className="space-y-4">
          <div className="flex items-start gap-3 rounded-xl border border-red-500/20 bg-red-500/5 p-4">
            <AlertTriangle className="mt-0.5 h-5 w-5 shrink-0 text-red-400" />
            <div>
              <p className="text-sm font-medium text-red-400">
                This action cannot be undone
              </p>
              <p className="mt-1 text-xs text-content-3">
                Your account will be deactivated and all your data will be
                inaccessible. This includes all CVs, projects, and settings.
              </p>
            </div>
          </div>
          <FloatingInput
            label="Enter your password to confirm"
            value={deletePassword}
            onChange={setDeletePassword}
            type="password"
            icon={Lock}
          />
          <div className="flex justify-end gap-3 pt-3">
            <button
              onClick={() => setDeleteAccountOpen(false)}
              className="rounded-xl px-4 py-2.5 text-sm font-medium text-content-3 transition hover:bg-white/[0.05]"
            >
              Cancel
            </button>
            <button
              onClick={handleDeleteAccount}
              className="flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-red-500/25 transition hover:bg-red-500"
            >
              <Trash2 className="h-4 w-4" />
              Delete My Account
            </button>
          </div>
        </div>
      </Modal>
    </div>
  );
}
