"use client";

import { useState, useEffect } from "react";
import { adminApi } from "@/lib/api";
import {
  Save,
  User,
  Mail,
  Globe,
  MapPin,
  Loader2,
  Sparkles,
  Plus,
  X,
} from "lucide-react";
import toast from "react-hot-toast";

interface CreatorSettings {
  creatorName: string;
  creatorTitle: string;
  creatorBio: string;
  creatorAvatar: string;
  creatorSkills: string[];
  creatorEmail: string;
  creatorLinkedin: string;
  creatorGithub: string;
  creatorWebsite: string;
  creatorLocation: string;
}

export default function AdminCreatorPage() {
  const [settings, setSettings] = useState<CreatorSettings>({
    creatorName: "",
    creatorTitle: "",
    creatorBio: "",
    creatorAvatar: "",
    creatorSkills: [],
    creatorEmail: "",
    creatorLinkedin: "",
    creatorGithub: "",
    creatorWebsite: "",
    creatorLocation: "",
  });
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [skillInput, setSkillInput] = useState("");

  useEffect(() => {
    loadSettings();
  }, []);

  const loadSettings = async () => {
    try {
      const res = await adminApi.getSiteSettings();
      if (res.data) {
        setSettings({
          creatorName: res.data.creatorName || "",
          creatorTitle: res.data.creatorTitle || "",
          creatorBio: res.data.creatorBio || "",
          creatorAvatar: res.data.creatorAvatar || "",
          creatorSkills: res.data.creatorSkills || [],
          creatorEmail: res.data.creatorEmail || "",
          creatorLinkedin: res.data.creatorLinkedin || "",
          creatorGithub: res.data.creatorGithub || "",
          creatorWebsite: res.data.creatorWebsite || "",
          creatorLocation: res.data.creatorLocation || "",
        });
      }
    } catch {
      toast.error("Failed to load settings");
    } finally {
      setLoading(false);
    }
  };

  const handleSave = async () => {
    setSaving(true);
    try {
      await adminApi.updateSiteSettings(settings);
      toast.success("Creator info saved!");
    } catch {
      toast.error("Failed to save settings");
    } finally {
      setSaving(false);
    }
  };

  const addSkill = () => {
    const skill = skillInput.trim();
    if (skill && !settings.creatorSkills.includes(skill)) {
      setSettings({
        ...settings,
        creatorSkills: [...settings.creatorSkills, skill],
      });
      setSkillInput("");
    }
  };

  const removeSkill = (index: number) => {
    setSettings({
      ...settings,
      creatorSkills: settings.creatorSkills.filter((_, i) => i !== index),
    });
  };

  if (loading) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-orange-400" />
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl">
      <div className="mb-8 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">About Creator</h1>
          <p className="mt-1 text-sm text-content-3">
            Edit the creator profile shown on the landing page
          </p>
        </div>
        <button
          onClick={handleSave}
          disabled={saving}
          className="inline-flex items-center gap-2 rounded-xl bg-orange-600 px-5 py-2.5 text-sm font-semibold text-white shadow-lg shadow-orange-600/20 transition hover:bg-orange-500 disabled:opacity-50"
        >
          {saving ? (
            <Loader2 className="h-4 w-4 animate-spin" />
          ) : (
            <Save className="h-4 w-4" />
          )}
          {saving ? "Saving..." : "Save Changes"}
        </button>
      </div>

      <div className="space-y-6">
        {/* Basic Info */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-content">
            <User className="h-4 w-4 text-orange-400" />
            Basic Information
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Full Name
              </label>
              <input
                value={settings.creatorName}
                onChange={(e) =>
                  setSettings({ ...settings, creatorName: e.target.value })
                }
                placeholder="John Doe"
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Title / Role
              </label>
              <input
                value={settings.creatorTitle}
                onChange={(e) =>
                  setSettings({ ...settings, creatorTitle: e.target.value })
                }
                placeholder="Full-Stack Developer & AI Enthusiast"
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Bio
              </label>
              <textarea
                value={settings.creatorBio}
                onChange={(e) =>
                  setSettings({ ...settings, creatorBio: e.target.value })
                }
                rows={3}
                placeholder="A short bio about yourself..."
                className="w-full resize-none rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 block text-sm font-medium text-content-2">
                Avatar URL
              </label>
              <input
                value={settings.creatorAvatar}
                onChange={(e) =>
                  setSettings({ ...settings, creatorAvatar: e.target.value })
                }
                placeholder="https://example.com/avatar.jpg"
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
              {settings.creatorAvatar && (
                <div className="mt-3 flex items-center gap-3">
                  <img
                    src={settings.creatorAvatar}
                    alt="Avatar preview"
                    className="h-14 w-14 rounded-2xl object-cover ring-1 ring-edge"
                  />
                  <span className="text-xs text-content-4">Preview</span>
                </div>
              )}
            </div>
          </div>
        </div>

        {/* Skills */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-content">
            <Sparkles className="h-4 w-4 text-orange-400" />
            Skills
          </div>
          <div className="mb-3 flex gap-2">
            <input
              value={skillInput}
              onChange={(e) => setSkillInput(e.target.value)}
              onKeyDown={(e) =>
                e.key === "Enter" && (e.preventDefault(), addSkill())
              }
              placeholder="Add a skill..."
              className="flex-1 rounded-xl border border-edge bg-field px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
            />
            <button
              onClick={addSkill}
              className="inline-flex items-center gap-1.5 rounded-xl bg-orange-600/10 px-4 py-2.5 text-sm font-medium text-orange-400 ring-1 ring-orange-500/20 transition hover:bg-orange-600/20"
            >
              <Plus className="h-4 w-4" />
              Add
            </button>
          </div>
          <div className="flex flex-wrap gap-2">
            {settings.creatorSkills.map((skill, i) => (
              <span
                key={i}
                className="inline-flex items-center gap-1.5 rounded-lg bg-orange-500/10 px-3 py-1.5 text-sm font-medium text-orange-400 ring-1 ring-orange-500/20"
              >
                {skill}
                <button
                  onClick={() => removeSkill(i)}
                  className="rounded p-0.5 hover:bg-orange-500/20 transition"
                >
                  <X className="h-3 w-3" />
                </button>
              </span>
            ))}
            {settings.creatorSkills.length === 0 && (
              <p className="text-sm text-content-4">No skills added yet</p>
            )}
          </div>
        </div>

        {/* Contact & Links */}
        <div className="rounded-2xl border border-edge bg-card p-6">
          <div className="mb-4 flex items-center gap-2 text-sm font-semibold text-content">
            <Globe className="h-4 w-4 text-orange-400" />
            Contact & Social Links
          </div>
          <div className="grid gap-4 sm:grid-cols-2">
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-2">
                <Mail className="h-3.5 w-3.5" />
                Email
              </label>
              <input
                value={settings.creatorEmail}
                onChange={(e) =>
                  setSettings({ ...settings, creatorEmail: e.target.value })
                }
                placeholder="email@example.com"
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 flex items-center gap-1.5 text-sm font-medium text-content-2">
                <MapPin className="h-3.5 w-3.5" />
                Location
              </label>
              <input
                value={settings.creatorLocation}
                onChange={(e) =>
                  setSettings({ ...settings, creatorLocation: e.target.value })
                }
                placeholder="San Francisco, CA"
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 text-sm font-medium text-content-2">
                LinkedIn URL
              </label>
              <input
                value={settings.creatorLinkedin}
                onChange={(e) =>
                  setSettings({ ...settings, creatorLinkedin: e.target.value })
                }
                placeholder="https://linkedin.com/in/..."
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
            <div>
              <label className="mb-1.5 text-sm font-medium text-content-2">
                GitHub URL
              </label>
              <input
                value={settings.creatorGithub}
                onChange={(e) =>
                  setSettings({ ...settings, creatorGithub: e.target.value })
                }
                placeholder="https://github.com/..."
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
            <div className="sm:col-span-2">
              <label className="mb-1.5 text-sm font-medium text-content-2">
                Website
              </label>
              <input
                value={settings.creatorWebsite}
                onChange={(e) =>
                  setSettings({ ...settings, creatorWebsite: e.target.value })
                }
                placeholder="https://yourwebsite.com"
                className="w-full rounded-xl border border-edge bg-field px-4 py-3 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
              />
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
