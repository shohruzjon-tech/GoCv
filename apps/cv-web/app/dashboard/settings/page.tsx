"use client";

import { useState, useEffect } from "react";
import { useAuthStore } from "@/lib/store";
import { authApi, uploadApi } from "@/lib/api";
import toast from "react-hot-toast";
import Link from "next/link";
import {
  Settings,
  User,
  CreditCard,
  Camera,
  Save,
  Loader2,
  Key,
} from "lucide-react";

export default function SettingsPage() {
  const { user, updateUser } = useAuthStore();
  const [name, setName] = useState(user?.name || "");
  const [headline, setHeadline] = useState(user?.headline || "");
  const [bio, setBio] = useState(user?.bio || "");
  const [location, setLocation] = useState(user?.location || "");
  const [website, setWebsite] = useState(user?.website || "");
  const [linkedin, setLinkedin] = useState(user?.socialLinks?.linkedin || "");
  const [github, setGithub] = useState(user?.socialLinks?.github || "");
  const [saving, setSaving] = useState(false);
  const [uploading, setUploading] = useState(false);

  const handleSave = async () => {
    setSaving(true);
    try {
      // The profile update would go through an API call
      // For now, update local store
      updateUser({
        name,
        headline,
        bio,
        location,
        website,
        socialLinks: { linkedin, github },
      });
      toast.success("Profile updated!");
    } catch {
      toast.error("Failed to save");
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

  return (
    <div className="space-y-8">
      <div>
        <h1 className="text-3xl font-bold tracking-tight text-content">
          <span className="text-gradient">Settings</span>
        </h1>
        <p className="mt-1 text-sm text-content-2">
          Manage your account settings and profile
        </p>
      </div>

      {/* Tabs */}
      <div className="flex gap-2 border-b border-edge pb-1">
        <Link
          href="/dashboard/settings"
          className="rounded-t-xl border-b-2 border-indigo-500 px-4 py-2 text-sm font-medium text-content"
        >
          <User className="mb-0.5 mr-1.5 inline h-4 w-4" />
          Profile
        </Link>
        <Link
          href="/dashboard/settings/billing"
          className="rounded-t-xl border-b-2 border-transparent px-4 py-2 text-sm font-medium text-content-2 hover:text-content"
        >
          <CreditCard className="mb-0.5 mr-1.5 inline h-4 w-4" />
          Billing
        </Link>
        <Link
          href="/dashboard/settings/api-keys"
          className="rounded-t-xl border-b-2 border-transparent px-4 py-2 text-sm font-medium text-content-2 hover:text-content"
        >
          <Key className="mb-0.5 mr-1.5 inline h-4 w-4" />
          API Keys
        </Link>
      </div>

      {/* Avatar */}
      <div className="rounded-2xl border border-edge bg-card p-6">
        <h3 className="mb-4 text-sm font-semibold text-content">
          Profile Photo
        </h3>
        <div className="flex items-center gap-6">
          <div className="relative">
            {user?.avatar ? (
              <img
                src={user.avatar}
                alt=""
                className="h-20 w-20 rounded-full object-cover ring-2 ring-edge"
              />
            ) : (
              <div className="flex h-20 w-20 items-center justify-center rounded-full bg-indigo-600/30 text-2xl font-bold text-indigo-300 ring-2 ring-indigo-500/30">
                {user?.name?.charAt(0)?.toUpperCase()}
              </div>
            )}
            <label className="absolute -bottom-1 -right-1 flex h-8 w-8 cursor-pointer items-center justify-center rounded-full bg-indigo-600 text-white shadow-lg hover:bg-indigo-500">
              {uploading ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Camera className="h-4 w-4" />
              )}
              <input
                type="file"
                accept="image/*"
                onChange={handleAvatarUpload}
                className="hidden"
              />
            </label>
          </div>
          <div>
            <p className="text-sm font-medium text-content">{user?.name}</p>
            <p className="text-xs text-content-3">{user?.email}</p>
          </div>
        </div>
      </div>

      {/* Profile Form */}
      <div className="rounded-2xl border border-edge bg-card p-6 space-y-5">
        <h3 className="text-sm font-semibold text-content">
          Profile Information
        </h3>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-2">
              Full Name
            </label>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm text-content outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-2">
              Headline
            </label>
            <input
              value={headline}
              onChange={(e) => setHeadline(e.target.value)}
              placeholder="e.g. Full Stack Developer"
              className="w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <div>
          <label className="mb-1.5 block text-xs font-medium text-content-2">
            Bio
          </label>
          <textarea
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="Tell us about yourself..."
            className="w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
          />
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-2">
              Location
            </label>
            <input
              value={location}
              onChange={(e) => setLocation(e.target.value)}
              placeholder="City, Country"
              className="w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-2">
              Website
            </label>
            <input
              value={website}
              onChange={(e) => setWebsite(e.target.value)}
              placeholder="https://..."
              className="w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <div className="grid gap-5 sm:grid-cols-2">
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-2">
              LinkedIn
            </label>
            <input
              value={linkedin}
              onChange={(e) => setLinkedin(e.target.value)}
              placeholder="https://linkedin.com/in/..."
              className="w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
            />
          </div>
          <div>
            <label className="mb-1.5 block text-xs font-medium text-content-2">
              GitHub
            </label>
            <input
              value={github}
              onChange={(e) => setGithub(e.target.value)}
              placeholder="https://github.com/..."
              className="w-full rounded-xl border border-edge bg-card px-4 py-2.5 text-sm text-content placeholder-content-3 outline-none focus:border-indigo-500/50"
            />
          </div>
        </div>

        <button
          onClick={handleSave}
          disabled={saving}
          className="flex items-center gap-2 rounded-xl bg-gradient-to-r from-indigo-600 to-purple-600 px-6 py-2.5 text-sm font-semibold text-white shadow-lg transition disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>
    </div>
  );
}
