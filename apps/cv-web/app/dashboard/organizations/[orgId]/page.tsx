"use client";

import { useState, useEffect, use } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { organizationsApi } from "@/lib/api";
import { useAuthStore, useOrganizationStore } from "@/lib/store";
import { Organization, OrgMembership, Team } from "@/types";
import toast from "react-hot-toast";
import {
  Building2,
  Users,
  UserPlus,
  Settings,
  Crown,
  Shield,
  Trash2,
  Loader2,
  ChevronLeft,
  FileText,
  Palette,
  BarChart3,
  Globe,
  Briefcase,
  ArrowRight,
  Edit2,
  User,
  UserMinus,
  MoreHorizontal,
  Plus,
  Hash,
} from "lucide-react";
import Select from "@/components/ui/select";

type Tab = "overview" | "members" | "teams" | "settings";

const roleLabels: Record<
  string,
  { label: string; color: string; icon: typeof Crown }
> = {
  owner: {
    label: "Owner",
    color: "text-amber-400 bg-amber-500/10",
    icon: Crown,
  },
  admin: {
    label: "Admin",
    color: "text-purple-400 bg-purple-500/10",
    icon: Shield,
  },
  recruiter: {
    label: "Recruiter",
    color: "text-blue-400 bg-blue-500/10",
    icon: Briefcase,
  },
  member: {
    label: "Member",
    color: "text-emerald-400 bg-emerald-500/10",
    icon: User,
  },
  viewer: {
    label: "Viewer",
    color: "text-content-3 bg-card-hover",
    icon: User,
  },
};

export default function OrgDetailPage({
  params,
}: {
  params: Promise<{ orgId: string }>;
}) {
  const { orgId } = use(params);
  const router = useRouter();
  const { user } = useAuthStore();
  const { updateOrganization, removeOrganization } = useOrganizationStore();

  const [org, setOrg] = useState<Organization | null>(null);
  const [members, setMembers] = useState<OrgMembership[]>([]);
  const [teams, setTeams] = useState<Team[]>([]);
  const [loading, setLoading] = useState(true);
  const [tab, setTab] = useState<Tab>("overview");

  // Invite state
  const [showInvite, setShowInvite] = useState(false);
  const [inviteEmail, setInviteEmail] = useState("");
  const [inviteRole, setInviteRole] = useState("member");
  const [inviting, setInviting] = useState(false);

  // Team create state
  const [showCreateTeam, setShowCreateTeam] = useState(false);
  const [teamForm, setTeamForm] = useState({
    name: "",
    description: "",
    color: "#6366f1",
  });
  const [creatingTeam, setCreatingTeam] = useState(false);

  // Settings state
  const [orgName, setOrgName] = useState("");
  const [orgDesc, setOrgDesc] = useState("");
  const [saving, setSaving] = useState(false);
  const [deleting, setDeleting] = useState(false);

  useEffect(() => {
    loadOrg();
  }, [orgId]);

  const loadOrg = async () => {
    setLoading(true);
    try {
      const [orgRes, membersRes, teamsRes] = await Promise.all([
        organizationsApi.getById(orgId),
        organizationsApi
          .getMembers(orgId)
          .catch(() => ({ data: { members: [] } })),
        organizationsApi.getTeams(orgId).catch(() => ({ data: [] })),
      ]);
      setOrg(orgRes.data);
      setMembers(
        Array.isArray(membersRes.data)
          ? membersRes.data
          : membersRes.data?.members || [],
      );
      setTeams(Array.isArray(teamsRes.data) ? teamsRes.data : []);
      setOrgName(orgRes.data.name);
      setOrgDesc(orgRes.data.description || "");
    } catch {
      toast.error("Failed to load organization");
      router.push("/dashboard/organizations");
    } finally {
      setLoading(false);
    }
  };

  const handleInvite = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inviteEmail.trim()) return;
    setInviting(true);
    try {
      await organizationsApi.inviteMember(orgId, {
        email: inviteEmail,
        role: inviteRole,
      });
      toast.success(`Invited ${inviteEmail}`);
      setInviteEmail("");
      setShowInvite(false);
      loadOrg();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to invite member");
    } finally {
      setInviting(false);
    }
  };

  const handleRemoveMember = async (userId: string, name: string) => {
    if (!confirm(`Remove ${name} from this organization?`)) return;
    try {
      await organizationsApi.removeMember(orgId, userId);
      toast.success("Member removed");
      loadOrg();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to remove member");
    }
  };

  const handleRoleChange = async (userId: string, newRole: string) => {
    try {
      await organizationsApi.updateMemberRole(orgId, userId, newRole);
      toast.success("Role updated");
      loadOrg();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to update role");
    }
  };

  const handleCreateTeam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!teamForm.name.trim()) return;
    setCreatingTeam(true);
    try {
      await organizationsApi.createTeam(orgId, teamForm);
      toast.success("Team created!");
      setTeamForm({ name: "", description: "", color: "#6366f1" });
      setShowCreateTeam(false);
      loadOrg();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to create team");
    } finally {
      setCreatingTeam(false);
    }
  };

  const handleDeleteTeam = async (teamId: string, teamName: string) => {
    if (!confirm(`Delete team "${teamName}"? This cannot be undone.`)) return;
    try {
      await organizationsApi.deleteTeam(orgId, teamId);
      toast.success("Team deleted");
      loadOrg();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete team");
    }
  };

  const handleSaveSettings = async () => {
    setSaving(true);
    try {
      const res = await organizationsApi.update(orgId, {
        name: orgName,
        description: orgDesc,
      });
      setOrg(res.data);
      updateOrganization(orgId, res.data);
      toast.success("Organization updated");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to save");
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteOrg = async () => {
    if (
      !confirm(
        "Are you sure you want to delete this organization? This action is permanent and cannot be undone.",
      )
    )
      return;
    setDeleting(true);
    try {
      await organizationsApi.delete(orgId);
      removeOrganization(orgId);
      toast.success("Organization deleted");
      router.push("/dashboard/organizations");
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Failed to delete");
    } finally {
      setDeleting(false);
    }
  };

  if (loading || !org) {
    return (
      <div className="flex min-h-[60vh] items-center justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-indigo-400" />
      </div>
    );
  }

  const tabs: { key: Tab; label: string; icon: typeof Users }[] = [
    { key: "overview", label: "Overview", icon: BarChart3 },
    { key: "members", label: "Members", icon: Users },
    { key: "teams", label: "Teams", icon: Hash },
    { key: "settings", label: "Settings", icon: Settings },
  ];

  return (
    <div className="space-y-6">
      {/* Back link */}
      <Link
        href="/dashboard/organizations"
        className="inline-flex items-center gap-1.5 text-sm text-content-3 transition hover:text-content"
      >
        <ChevronLeft className="h-4 w-4" />
        All Organizations
      </Link>

      {/* Header */}
      <div className="flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div className="flex items-center gap-4">
          <div className="flex h-14 w-14 items-center justify-center rounded-2xl bg-indigo-600/20 ring-1 ring-indigo-500/30">
            <Building2 className="h-7 w-7 text-indigo-400" />
          </div>
          <div>
            <h1 className="text-2xl font-bold text-content">{org.name}</h1>
            <div className="flex items-center gap-3 mt-1">
              <span className="text-sm text-content-3">/{org.slug}</span>
              <span
                className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${
                  org.plan === "enterprise"
                    ? "text-amber-400 bg-amber-500/10"
                    : org.plan === "business"
                      ? "text-purple-400 bg-purple-500/10"
                      : "text-blue-400 bg-blue-500/10"
                }`}
              >
                {org.plan.charAt(0).toUpperCase() + org.plan.slice(1)}
              </span>
            </div>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="flex gap-1 border-b border-edge">
        {tabs.map((t) => (
          <button
            key={t.key}
            onClick={() => setTab(t.key)}
            className={`flex items-center gap-2 border-b-2 px-4 py-2.5 text-sm font-medium transition ${
              tab === t.key
                ? "border-indigo-500 text-content"
                : "border-transparent text-content-3 hover:text-content hover:border-edge"
            }`}
          >
            <t.icon className="h-4 w-4" />
            {t.label}
          </button>
        ))}
      </div>

      {/* Tab Content */}
      {tab === "overview" && (
        <div className="space-y-6">
          {/* Stats */}
          <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-4">
            {[
              {
                label: "Members",
                value: org.memberCount,
                icon: Users,
                color: "text-blue-400 bg-blue-500/10",
              },
              {
                label: "Max Members",
                value: org.maxMembers === 0 ? "∞" : org.maxMembers,
                icon: Shield,
                color: "text-purple-400 bg-purple-500/10",
              },
              {
                label: "Teams",
                value: teams.length,
                icon: Hash,
                color: "text-emerald-400 bg-emerald-500/10",
              },
              {
                label: "CVs Created",
                value: org.totalCvsCreated || 0,
                icon: FileText,
                color: "text-amber-400 bg-amber-500/10",
              },
            ].map((stat) => (
              <div
                key={stat.label}
                className="rounded-2xl border border-edge bg-card p-5 shadow-sm"
              >
                <div className="flex items-center justify-between">
                  <span className="text-sm text-content-3">{stat.label}</span>
                  <div
                    className={`flex h-9 w-9 items-center justify-center rounded-xl ${stat.color}`}
                  >
                    <stat.icon className="h-4 w-4" />
                  </div>
                </div>
                <p className="mt-2 text-2xl font-bold text-content">
                  {stat.value}
                </p>
              </div>
            ))}
          </div>

          {/* Org Details */}
          {(org.description || org.industry || org.website) && (
            <div className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-3">
              <h3 className="text-sm font-semibold text-content-2 uppercase tracking-wider">
                Details
              </h3>
              {org.description && (
                <p className="text-sm text-content-2">{org.description}</p>
              )}
              <div className="flex flex-wrap gap-4 text-sm text-content-3">
                {org.industry && (
                  <span className="inline-flex items-center gap-1.5">
                    <Briefcase className="h-4 w-4" />
                    {org.industry}
                  </span>
                )}
                {org.website && (
                  <a
                    href={org.website}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-flex items-center gap-1.5 text-indigo-400 hover:underline"
                  >
                    <Globe className="h-4 w-4" />
                    {org.website}
                  </a>
                )}
                {org.size && (
                  <span className="inline-flex items-center gap-1.5">
                    <Users className="h-4 w-4" />
                    {org.size} employees
                  </span>
                )}
              </div>
            </div>
          )}

          {/* Recent Members */}
          <div className="rounded-2xl border border-edge bg-card p-6 shadow-sm">
            <div className="flex items-center justify-between mb-4">
              <h3 className="text-sm font-semibold text-content-2 uppercase tracking-wider">
                Members
              </h3>
              <button
                onClick={() => setTab("members")}
                className="text-xs text-indigo-400 hover:underline inline-flex items-center gap-1"
              >
                View all <ArrowRight className="h-3 w-3" />
              </button>
            </div>
            <div className="space-y-2">
              {members.slice(0, 5).map((m) => {
                const memberUser =
                  typeof m.userId === "string" ? null : m.userId;
                const role = roleLabels[m.role] || roleLabels.member;
                return (
                  <div
                    key={m._id}
                    className="flex items-center gap-3 rounded-xl px-3 py-2 transition hover:bg-card-hover"
                  >
                    <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-semibold text-indigo-300 ring-1 ring-indigo-500/30">
                      {memberUser?.name?.charAt(0)?.toUpperCase() || "?"}
                    </div>
                    <div className="min-w-0 flex-1">
                      <p className="truncate text-sm font-medium text-content">
                        {memberUser?.name || "Unknown User"}
                      </p>
                      <p className="truncate text-xs text-content-3">
                        {memberUser?.email || ""}
                      </p>
                    </div>
                    <span
                      className={`inline-flex items-center rounded-full px-2 py-0.5 text-xs font-medium ${role.color}`}
                    >
                      {role.label}
                    </span>
                  </div>
                );
              })}
              {members.length === 0 && (
                <p className="text-sm text-content-4 py-4 text-center">
                  No members yet
                </p>
              )}
            </div>
          </div>
        </div>
      )}

      {tab === "members" && (
        <div className="space-y-4">
          {/* Invite Button */}
          <div className="flex justify-end">
            <button
              onClick={() => setShowInvite(!showInvite)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <UserPlus className="h-4 w-4" />
              Invite Member
            </button>
          </div>

          {/* Invite Form */}
          {showInvite && (
            <form
              onSubmit={handleInvite}
              className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-semibold text-content">
                Invite Member
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-content-2">
                    Email
                  </label>
                  <input
                    type="email"
                    value={inviteEmail}
                    onChange={(e) => setInviteEmail(e.target.value)}
                    placeholder="user@example.com"
                    className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-content-2">
                    Role
                  </label>
                  <Select
                    value={inviteRole}
                    onChange={setInviteRole}
                    options={[
                      { value: "viewer", label: "Viewer" },
                      { value: "member", label: "Member" },
                      { value: "recruiter", label: "Recruiter" },
                      { value: "admin", label: "Admin" },
                    ]}
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={inviting}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {inviting && <Loader2 className="h-4 w-4 animate-spin" />}
                  Send Invite
                </button>
                <button
                  type="button"
                  onClick={() => setShowInvite(false)}
                  className="rounded-xl border border-edge px-5 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {/* Members List */}
          <div className="rounded-2xl border border-edge bg-card shadow-sm overflow-hidden">
            <table className="w-full">
              <thead>
                <tr className="border-b border-edge">
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-semibold uppercase tracking-wider text-content-3">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-right text-xs font-semibold uppercase tracking-wider text-content-3">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="divide-y divide-edge">
                {members.map((m) => {
                  const memberUser =
                    typeof m.userId === "string" ? null : m.userId;
                  const userId =
                    typeof m.userId === "string" ? m.userId : m.userId._id;
                  const role = roleLabels[m.role] || roleLabels.member;
                  const isCurrentUser = userId === user?._id;

                  return (
                    <tr key={m._id} className="transition hover:bg-card-hover">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-indigo-600/30 text-xs font-semibold text-indigo-300">
                            {memberUser?.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                          <div>
                            <p className="text-sm font-medium text-content">
                              {memberUser?.name || "Unknown"}{" "}
                              {isCurrentUser && (
                                <span className="text-content-4">(you)</span>
                              )}
                            </p>
                            <p className="text-xs text-content-3">
                              {memberUser?.email || ""}
                            </p>
                          </div>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        {m.role === "owner" ? (
                          <span
                            className={`inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-medium ${role.color}`}
                          >
                            <Crown className="mr-1 h-3 w-3" />
                            {role.label}
                          </span>
                        ) : (
                          <Select
                            value={m.role}
                            onChange={(val) => handleRoleChange(userId, val)}
                            disabled={isCurrentUser}
                            options={[
                              { value: "viewer", label: "Viewer" },
                              { value: "member", label: "Member" },
                              { value: "recruiter", label: "Recruiter" },
                              { value: "admin", label: "Admin" },
                            ]}
                          />
                        )}
                      </td>
                      <td className="px-6 py-4 text-sm text-content-3">
                        {m.joinedAt
                          ? new Date(m.joinedAt).toLocaleDateString()
                          : "—"}
                      </td>
                      <td className="px-6 py-4 text-right">
                        {m.role !== "owner" && !isCurrentUser && (
                          <button
                            onClick={() =>
                              handleRemoveMember(
                                userId,
                                memberUser?.name || "this user",
                              )
                            }
                            className="rounded-lg p-1.5 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                            title="Remove member"
                          >
                            <UserMinus className="h-4 w-4" />
                          </button>
                        )}
                      </td>
                    </tr>
                  );
                })}
              </tbody>
            </table>
            {members.length === 0 && (
              <div className="py-12 text-center text-sm text-content-4">
                No members found
              </div>
            )}
          </div>
        </div>
      )}

      {tab === "teams" && (
        <div className="space-y-4">
          <div className="flex justify-end">
            <button
              onClick={() => setShowCreateTeam(!showCreateTeam)}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-4 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500"
            >
              <Plus className="h-4 w-4" />
              New Team
            </button>
          </div>

          {showCreateTeam && (
            <form
              onSubmit={handleCreateTeam}
              className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-4"
            >
              <h3 className="text-lg font-semibold text-content">
                Create Team
              </h3>
              <div className="grid gap-4 sm:grid-cols-2">
                <div>
                  <label className="mb-1 block text-sm font-medium text-content-2">
                    Name
                  </label>
                  <input
                    value={teamForm.name}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, name: e.target.value })
                    }
                    placeholder="Engineering"
                    className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                    required
                  />
                </div>
                <div>
                  <label className="mb-1 block text-sm font-medium text-content-2">
                    Color
                  </label>
                  <input
                    type="color"
                    value={teamForm.color}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, color: e.target.value })
                    }
                    className="h-[42px] w-full cursor-pointer rounded-xl border border-edge bg-surface"
                  />
                </div>
                <div className="sm:col-span-2">
                  <label className="mb-1 block text-sm font-medium text-content-2">
                    Description
                  </label>
                  <input
                    value={teamForm.description}
                    onChange={(e) =>
                      setTeamForm({ ...teamForm, description: e.target.value })
                    }
                    placeholder="What does this team do?"
                    className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content placeholder:text-content-4 focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                  />
                </div>
              </div>
              <div className="flex gap-3">
                <button
                  type="submit"
                  disabled={creatingTeam}
                  className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
                >
                  {creatingTeam && <Loader2 className="h-4 w-4 animate-spin" />}
                  Create Team
                </button>
                <button
                  type="button"
                  onClick={() => setShowCreateTeam(false)}
                  className="rounded-xl border border-edge px-5 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
                >
                  Cancel
                </button>
              </div>
            </form>
          )}

          {teams.length === 0 ? (
            <div className="flex flex-col items-center justify-center rounded-2xl border border-dashed border-edge bg-card/50 py-16 text-center">
              <Hash className="h-10 w-10 text-content-4" />
              <h3 className="mt-3 text-lg font-semibold text-content">
                No teams yet
              </h3>
              <p className="mt-1 text-sm text-content-3">
                Create teams to organize members and CVs
              </p>
            </div>
          ) : (
            <div className="grid gap-4 sm:grid-cols-2 lg:grid-cols-3">
              {teams.map((team) => {
                const memberCount = Array.isArray(team.memberIds)
                  ? team.memberIds.length
                  : 0;
                return (
                  <div
                    key={team._id}
                    className="rounded-2xl border border-edge bg-card p-5 shadow-sm transition hover:border-indigo-500/30"
                  >
                    <div className="flex items-start justify-between">
                      <div className="flex items-center gap-3">
                        <div
                          className="flex h-10 w-10 items-center justify-center rounded-xl text-white text-sm font-bold"
                          style={{ backgroundColor: team.color || "#6366f1" }}
                        >
                          {team.icon || team.name.charAt(0).toUpperCase()}
                        </div>
                        <div>
                          <h3 className="text-sm font-semibold text-content">
                            {team.name}
                          </h3>
                          <p className="text-xs text-content-3">/{team.slug}</p>
                        </div>
                      </div>
                      <button
                        onClick={() => handleDeleteTeam(team._id, team.name)}
                        className="rounded-lg p-1.5 text-content-4 transition hover:bg-red-500/10 hover:text-red-400"
                      >
                        <Trash2 className="h-4 w-4" />
                      </button>
                    </div>
                    {team.description && (
                      <p className="mt-2 text-xs text-content-3 line-clamp-2">
                        {team.description}
                      </p>
                    )}
                    <div className="mt-3 flex items-center gap-3 text-xs text-content-3">
                      <span className="inline-flex items-center gap-1">
                        <Users className="h-3.5 w-3.5" />
                        {memberCount} member{memberCount !== 1 ? "s" : ""}
                      </span>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      )}

      {tab === "settings" && (
        <div className="space-y-6">
          {/* General Settings */}
          <div className="rounded-2xl border border-edge bg-card p-6 shadow-sm space-y-4">
            <h3 className="text-lg font-semibold text-content">General</h3>
            <div className="grid gap-4 sm:grid-cols-2">
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Organization Name
                </label>
                <input
                  value={orgName}
                  onChange={(e) => setOrgName(e.target.value)}
                  className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500"
                />
              </div>
              <div>
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Slug
                </label>
                <input
                  value={org.slug}
                  disabled
                  className="w-full rounded-xl border border-edge bg-card-hover px-4 py-2.5 text-sm text-content-3 cursor-not-allowed"
                />
              </div>
              <div className="sm:col-span-2">
                <label className="mb-1 block text-sm font-medium text-content-2">
                  Description
                </label>
                <textarea
                  value={orgDesc}
                  onChange={(e) => setOrgDesc(e.target.value)}
                  rows={3}
                  className="w-full rounded-xl border border-edge bg-surface px-4 py-2.5 text-sm text-content focus:border-indigo-500 focus:outline-none focus:ring-1 focus:ring-indigo-500 resize-none"
                />
              </div>
            </div>
            <button
              onClick={handleSaveSettings}
              disabled={saving}
              className="inline-flex items-center gap-2 rounded-xl bg-indigo-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-indigo-500 disabled:opacity-50"
            >
              {saving && <Loader2 className="h-4 w-4 animate-spin" />}
              Save Changes
            </button>
          </div>

          {/* Danger Zone */}
          <div className="rounded-2xl border border-red-500/20 bg-red-500/5 p-6 space-y-4">
            <h3 className="text-lg font-semibold text-red-400">Danger Zone</h3>
            <p className="text-sm text-content-3">
              Permanently delete this organization and all its data. This action
              cannot be undone.
            </p>
            <button
              onClick={handleDeleteOrg}
              disabled={deleting}
              className="inline-flex items-center gap-2 rounded-xl bg-red-600 px-5 py-2.5 text-sm font-semibold text-white transition hover:bg-red-500 disabled:opacity-50"
            >
              {deleting && <Loader2 className="h-4 w-4 animate-spin" />}
              <Trash2 className="h-4 w-4" />
              Delete Organization
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
