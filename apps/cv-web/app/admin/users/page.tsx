"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { adminApi } from "@/lib/api";
import { User } from "@/types";
import {
  Search,
  Filter,
  ArrowUpDown,
  UserCheck,
  UserX,
  Trash2,
  Key,
  ChevronLeft,
  ChevronRight,
  Loader2,
  Users,
  Shield,
  CheckSquare,
  Square,
  MinusSquare,
  Eye,
  MoreHorizontal,
  X,
} from "lucide-react";
import Select from "@/components/ui/select";
import toast from "react-hot-toast";

const LIMIT = 20;

const ROLE_OPTIONS = [
  { value: "", label: "All Roles" },
  { value: "user", label: "User" },
  { value: "admin", label: "Admin" },
  { value: "super_admin", label: "Super Admin" },
];

const STATUS_OPTIONS = [
  { value: "", label: "All Statuses" },
  { value: "active", label: "Active" },
  { value: "inactive", label: "Inactive" },
  { value: "verified", label: "Verified" },
  { value: "unverified", label: "Unverified" },
];

const SORT_OPTIONS = [
  { value: "createdAt", label: "Date Joined" },
  { value: "name", label: "Name" },
  { value: "email", label: "Email" },
  { value: "lastLoginAt", label: "Last Login" },
];

export default function AdminUsersPage() {
  const router = useRouter();
  const [users, setUsers] = useState<any[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  // Filters
  const [search, setSearch] = useState("");
  const [roleFilter, setRoleFilter] = useState("");
  const [statusFilter, setStatusFilter] = useState("");
  const [sortBy, setSortBy] = useState("createdAt");
  const [sortOrder, setSortOrder] = useState("desc");
  const [showFilters, setShowFilters] = useState(false);

  // Selection
  const [selected, setSelected] = useState<Set<string>>(new Set());
  const [bulkLoading, setBulkLoading] = useState(false);

  // Action menu
  const [actionMenuId, setActionMenuId] = useState<string | null>(null);

  const loadUsers = useCallback(async () => {
    setLoading(true);
    try {
      const res = await adminApi.getUsers(page, LIMIT, {
        search: search || undefined,
        role: roleFilter || undefined,
        status: statusFilter || undefined,
        sortBy,
        sortOrder,
      });
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  }, [page, search, roleFilter, statusFilter, sortBy, sortOrder]);

  useEffect(() => {
    const timeout = setTimeout(() => {
      loadUsers();
    }, 300);
    return () => clearTimeout(timeout);
  }, [loadUsers]);

  useEffect(() => {
    setPage(1);
    setSelected(new Set());
  }, [search, roleFilter, statusFilter, sortBy, sortOrder]);

  // Selection helpers
  const allSelected =
    users.length > 0 && users.every((u) => selected.has(u._id));
  const someSelected = users.some((u) => selected.has(u._id));

  const toggleSelectAll = () => {
    if (allSelected) {
      setSelected(new Set());
    } else {
      setSelected(new Set(users.map((u) => u._id)));
    }
  };

  const toggleSelect = (id: string) => {
    setSelected((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  // Bulk actions
  const bulkSetStatus = async (isActive: boolean) => {
    const ids = Array.from(selected);
    if (ids.length === 0) return;
    setBulkLoading(true);
    try {
      await adminApi.bulkUpdateUserStatus(ids, isActive);
      setUsers((prev) =>
        prev.map((u) => (ids.includes(u._id) ? { ...u, isActive } : u)),
      );
      setSelected(new Set());
      toast.success(
        `${ids.length} user(s) ${isActive ? "activated" : "deactivated"}`,
      );
    } catch {
      toast.error("Failed to update users");
    } finally {
      setBulkLoading(false);
    }
  };

  // Single user actions
  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await adminApi.toggleUserActive(id, !currentlyActive);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, isActive: !currentlyActive } : u,
        ),
      );
      toast.success(currentlyActive ? "User deactivated" : "User activated");
    } catch {
      toast.error("Failed to update user");
    }
    setActionMenuId(null);
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await adminApi.changeUserRole(id, role);
      setUsers((prev) => prev.map((u) => (u._id === id ? { ...u, role } : u)));
      toast.success("Role updated");
    } catch {
      toast.error("Failed to update role");
    }
  };

  const deleteUser = async (id: string) => {
    if (!confirm("Are you sure? This action is irreversible.")) return;
    try {
      await adminApi.deleteUser(id);
      setUsers((prev) => prev.filter((u) => u._id !== id));
      setTotal((t) => t - 1);
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
    setActionMenuId(null);
  };

  const terminateAllSessions = async (userId: string) => {
    try {
      await adminApi.terminateAllUserSessions(userId);
      toast.success("All sessions terminated");
    } catch {
      toast.error("Failed to terminate sessions");
    }
    setActionMenuId(null);
  };

  const toggleSort = (field: string) => {
    if (sortBy === field) {
      setSortOrder((o) => (o === "asc" ? "desc" : "asc"));
    } else {
      setSortBy(field);
      setSortOrder("desc");
    }
  };

  const totalPages = Math.ceil(total / LIMIT);

  const formatDate = (d: string | undefined) => {
    if (!d) return "—";
    return new Date(d).toLocaleDateString("en-US", {
      month: "short",
      day: "numeric",
      year: "numeric",
    });
  };

  const roleBadge = (role: string) => {
    const map: Record<string, string> = {
      admin: "bg-purple-500/10 text-purple-400 ring-1 ring-purple-500/20",
      super_admin: "bg-amber-500/10 text-amber-400 ring-1 ring-amber-500/20",
      user: "bg-sky-500/10 text-sky-400 ring-1 ring-sky-500/20",
    };
    return map[role] || map.user;
  };

  const activeFilters = [roleFilter, statusFilter].filter(Boolean).length;

  return (
    <div>
      {/* Header */}
      <div className="mb-6 flex flex-col gap-4 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">Users</h1>
          <p className="mt-0.5 text-sm text-content-3">
            {total} total user{total !== 1 ? "s" : ""} &middot; Manage accounts
            & access
          </p>
        </div>
      </div>

      {/* Search & Filter Bar */}
      <div className="mb-4 flex flex-col gap-3 sm:flex-row sm:items-center">
        {/* Search */}
        <div className="relative w-full sm:max-w-xs">
          <Search className="pointer-events-none absolute left-3.5 top-1/2 h-4 w-4 -translate-y-1/2 text-content-4" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="Search by name, email, or username..."
            className="w-full rounded-xl border border-edge bg-field py-2.5 pl-10 pr-4 text-sm text-content placeholder:text-content-4 focus:border-orange-500/50 focus:outline-none focus:ring-2 focus:ring-orange-500/20 transition"
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              className="absolute right-3 top-1/2 -translate-y-1/2 rounded p-0.5 text-content-4 hover:text-content-2"
            >
              <X className="h-4 w-4" />
            </button>
          )}
        </div>

        {/* Filter toggle */}
        <button
          onClick={() => setShowFilters((f) => !f)}
          className={`inline-flex items-center gap-2 rounded-xl border px-4 py-2.5 text-sm font-medium transition ${
            showFilters || activeFilters > 0
              ? "border-orange-500/30 bg-orange-600/10 text-orange-400"
              : "border-edge bg-card text-content-2 hover:bg-card-hover"
          }`}
        >
          <Filter className="h-4 w-4" />
          Filters
          {activeFilters > 0 && (
            <span className="flex h-5 w-5 items-center justify-center rounded-full bg-orange-500 text-[10px] font-bold text-white">
              {activeFilters}
            </span>
          )}
        </button>

        {/* Sort */}
        <div className="flex items-center gap-2">
          <Select
            value={sortBy}
            onChange={(v) => setSortBy(v)}
            options={SORT_OPTIONS}
            placeholder="Sort by"
          />
          <button
            onClick={() => setSortOrder((o) => (o === "asc" ? "desc" : "asc"))}
            className="inline-flex items-center gap-1 rounded-xl border border-edge bg-card px-3 py-2.5 text-sm font-medium text-content-2 transition hover:bg-card-hover"
            title={sortOrder === "asc" ? "Ascending" : "Descending"}
          >
            <ArrowUpDown className="h-4 w-4" />
            {sortOrder === "asc" ? "A→Z" : "Z→A"}
          </button>
        </div>
      </div>

      {/* Expanded Filters */}
      {showFilters && (
        <div className="mb-4 flex flex-wrap items-center gap-3 rounded-xl border border-edge bg-card/60 p-4">
          <div className="min-w-[160px]">
            <Select
              value={roleFilter}
              onChange={(v) => setRoleFilter(v)}
              options={ROLE_OPTIONS}
              placeholder="Role"
              label="Role"
            />
          </div>
          <div className="min-w-[160px]">
            <Select
              value={statusFilter}
              onChange={(v) => setStatusFilter(v)}
              options={STATUS_OPTIONS}
              placeholder="Status"
              label="Status"
            />
          </div>
          {activeFilters > 0 && (
            <button
              onClick={() => {
                setRoleFilter("");
                setStatusFilter("");
              }}
              className="ml-auto text-sm text-orange-400 hover:text-orange-300 transition"
            >
              Clear filters
            </button>
          )}
        </div>
      )}

      {/* Bulk Actions Bar */}
      {selected.size > 0 && (
        <div className="mb-4 flex items-center gap-3 rounded-xl border border-orange-500/20 bg-orange-600/5 px-4 py-3">
          <span className="text-sm font-medium text-orange-400">
            {selected.size} selected
          </span>
          <div className="ml-auto flex items-center gap-2">
            <button
              onClick={() => bulkSetStatus(true)}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-emerald-600/10 px-3 py-1.5 text-sm font-medium text-emerald-400 ring-1 ring-emerald-500/20 transition hover:bg-emerald-600/20 disabled:opacity-50"
            >
              <UserCheck className="h-3.5 w-3.5" />
              Activate
            </button>
            <button
              onClick={() => bulkSetStatus(false)}
              disabled={bulkLoading}
              className="inline-flex items-center gap-1.5 rounded-lg bg-red-600/10 px-3 py-1.5 text-sm font-medium text-red-400 ring-1 ring-red-500/20 transition hover:bg-red-600/20 disabled:opacity-50"
            >
              <UserX className="h-3.5 w-3.5" />
              Deactivate
            </button>
            <button
              onClick={() => setSelected(new Set())}
              className="rounded-lg px-3 py-1.5 text-sm text-content-3 hover:text-content-2 transition"
            >
              Cancel
            </button>
          </div>
        </div>
      )}

      {/* Table */}
      <div className="rounded-2xl border border-edge bg-card">
        <div>
          <table className="w-full">
            <thead>
              <tr className="border-b border-edge bg-card">
                <th className="w-10 px-3 py-3">
                  <button
                    onClick={toggleSelectAll}
                    className="text-content-3 hover:text-content-2 transition"
                  >
                    {allSelected ? (
                      <CheckSquare className="h-4.5 w-4.5 text-orange-400" />
                    ) : someSelected ? (
                      <MinusSquare className="h-4.5 w-4.5 text-orange-400" />
                    ) : (
                      <Square className="h-4.5 w-4.5" />
                    )}
                  </button>
                </th>
                <th
                  className="cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-3 hover:text-content-2 transition"
                  onClick={() => toggleSort("name")}
                >
                  <div className="flex items-center gap-1">
                    User
                    {sortBy === "name" && (
                      <ArrowUpDown className="h-3 w-3 text-orange-400" />
                    )}
                  </div>
                </th>
                <th className="hidden px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-3 md:table-cell">
                  Role
                </th>
                <th className="px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-3">
                  Status
                </th>
                <th
                  className="hidden cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-3 hover:text-content-2 transition lg:table-cell"
                  onClick={() => toggleSort("createdAt")}
                >
                  <div className="flex items-center gap-1">
                    Joined
                    {sortBy === "createdAt" && (
                      <ArrowUpDown className="h-3 w-3 text-orange-400" />
                    )}
                  </div>
                </th>
                <th
                  className="hidden cursor-pointer px-3 py-3 text-left text-xs font-medium uppercase tracking-wider text-content-3 hover:text-content-2 transition lg:table-cell"
                  onClick={() => toggleSort("lastLoginAt")}
                >
                  <div className="flex items-center gap-1">
                    Last Login
                    {sortBy === "lastLoginAt" && (
                      <ArrowUpDown className="h-3 w-3 text-orange-400" />
                    )}
                  </div>
                </th>
                <th className="w-12 px-3 py-3 text-right text-xs font-medium uppercase tracking-wider text-content-3">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-edge">
              {loading ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Loader2 className="mx-auto h-6 w-6 animate-spin text-orange-400" />
                  </td>
                </tr>
              ) : users.length === 0 ? (
                <tr>
                  <td colSpan={7} className="py-12 text-center">
                    <Users className="mx-auto mb-2 h-8 w-8 text-content-4" />
                    <p className="text-sm text-content-3">No users found</p>
                  </td>
                </tr>
              ) : (
                users.map((user) => (
                  <tr
                    key={user._id}
                    className={`group transition ${
                      selected.has(user._id)
                        ? "bg-orange-600/5"
                        : "hover:bg-card-hover"
                    }`}
                  >
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => toggleSelect(user._id)}
                        className="text-content-3 hover:text-content-2 transition"
                      >
                        {selected.has(user._id) ? (
                          <CheckSquare className="h-4 w-4 text-orange-400" />
                        ) : (
                          <Square className="h-4 w-4" />
                        )}
                      </button>
                    </td>
                    <td className="px-3 py-2.5">
                      <button
                        onClick={() => router.push(`/admin/users/${user._id}`)}
                        className="flex items-center gap-3 text-left"
                      >
                        {user.avatar ? (
                          <img
                            src={user.avatar}
                            alt=""
                            className="h-8 w-8 rounded-full object-cover ring-1 ring-edge"
                          />
                        ) : (
                          <div className="flex h-8 w-8 items-center justify-center rounded-full bg-gradient-to-br from-orange-500/20 to-amber-500/20 text-xs font-semibold text-orange-400 ring-1 ring-orange-500/20">
                            {user.name?.charAt(0)?.toUpperCase() || "?"}
                          </div>
                        )}
                        <div className="min-w-0">
                          <p className="truncate text-sm font-medium text-content group-hover:text-orange-400 transition">
                            {user.name}
                          </p>
                          <p className="truncate text-xs text-content-3">
                            {user.email}
                          </p>
                        </div>
                      </button>
                    </td>
                    <td className="hidden px-3 py-2.5 md:table-cell">
                      <Select
                        value={user.role}
                        onChange={(val) => changeRole(user._id, val)}
                        options={[
                          { value: "user", label: "User" },
                          { value: "admin", label: "Admin" },
                          { value: "super_admin", label: "Super Admin" },
                        ]}
                      />
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="flex flex-col gap-1">
                        <span
                          className={`inline-flex w-fit items-center gap-1 rounded-full px-2 py-0.5 text-[11px] font-medium ${
                            user.isActive !== false
                              ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                              : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                          }`}
                        >
                          {user.isActive !== false ? "Active" : "Inactive"}
                        </span>
                        {user.isEmailVerified && (
                          <span className="inline-flex w-fit items-center gap-1 rounded-full bg-sky-500/10 px-2 py-0.5 text-[10px] font-medium text-sky-400 ring-1 ring-sky-500/20">
                            ✓ Verified
                          </span>
                        )}
                      </div>
                    </td>
                    <td className="hidden px-3 py-2.5 text-sm text-content-2 lg:table-cell">
                      {formatDate(user.createdAt)}
                    </td>
                    <td className="hidden px-3 py-2.5 text-sm text-content-3 lg:table-cell">
                      {formatDate(user.lastLoginAt)}
                    </td>
                    <td className="px-3 py-2.5">
                      <div className="relative flex justify-end">
                        <button
                          onClick={() =>
                            setActionMenuId(
                              actionMenuId === user._id ? null : user._id,
                            )
                          }
                          className="rounded-lg p-2 text-content-3 transition hover:bg-card-hover hover:text-content-2"
                        >
                          <MoreHorizontal className="h-4 w-4" />
                        </button>

                        {actionMenuId === user._id && (
                          <>
                            <div
                              className="fixed inset-0 z-10"
                              onClick={() => setActionMenuId(null)}
                            />
                            <div className="absolute right-0 top-full z-20 mt-1 w-48 overflow-hidden rounded-xl border border-edge bg-card shadow-xl shadow-black/20">
                              <button
                                onClick={() =>
                                  router.push(`/admin/users/${user._id}`)
                                }
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content-2 transition hover:bg-card-hover"
                              >
                                <Eye className="h-4 w-4" />
                                View Profile
                              </button>
                              <button
                                onClick={() =>
                                  toggleActive(
                                    user._id,
                                    user.isActive !== false,
                                  )
                                }
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-content-2 transition hover:bg-card-hover"
                              >
                                {user.isActive !== false ? (
                                  <>
                                    <UserX className="h-4 w-4" />
                                    Deactivate
                                  </>
                                ) : (
                                  <>
                                    <UserCheck className="h-4 w-4" />
                                    Activate
                                  </>
                                )}
                              </button>
                              <button
                                onClick={() => terminateAllSessions(user._id)}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-orange-400 transition hover:bg-card-hover"
                              >
                                <Key className="h-4 w-4" />
                                Terminate Sessions
                              </button>
                              <div className="border-t border-edge" />
                              <button
                                onClick={() => deleteUser(user._id)}
                                className="flex w-full items-center gap-2.5 px-4 py-2.5 text-sm text-red-400 transition hover:bg-red-500/5"
                              >
                                <Trash2 className="h-4 w-4" />
                                Delete User
                              </button>
                            </div>
                          </>
                        )}
                      </div>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>

      {/* Pagination */}
      <div className="mt-4 flex items-center justify-between">
        <p className="text-sm text-content-3">
          {total > 0
            ? `Showing ${(page - 1) * LIMIT + 1}–${Math.min(page * LIMIT, total)} of ${total}`
            : "No results"}
        </p>
        <div className="flex items-center gap-1">
          <button
            onClick={() => setPage(1)}
            disabled={page === 1}
            className="rounded-lg border border-edge bg-card px-2.5 py-1.5 text-xs text-content-2 transition hover:bg-card-hover disabled:opacity-30"
          >
            First
          </button>
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="inline-flex items-center rounded-lg border border-edge bg-card px-2 py-1.5 text-content-2 transition hover:bg-card-hover disabled:opacity-30"
          >
            <ChevronLeft className="h-4 w-4" />
          </button>
          {(() => {
            const pages: number[] = [];
            const maxVisible = 5;
            let start = Math.max(1, page - Math.floor(maxVisible / 2));
            let end = start + maxVisible - 1;
            if (end > totalPages) {
              end = totalPages;
              start = Math.max(1, end - maxVisible + 1);
            }
            for (let i = start; i <= end; i++) pages.push(i);
            return pages.map((p) => (
              <button
                key={p}
                onClick={() => setPage(p)}
                className={`rounded-lg px-3 py-1.5 text-sm font-medium transition ${
                  page === p
                    ? "bg-orange-600 text-white shadow shadow-orange-600/20"
                    : "text-content-3 hover:bg-card-hover hover:text-content-2"
                }`}
              >
                {p}
              </button>
            ));
          })()}
          <button
            onClick={() => setPage((p) => Math.min(totalPages, p + 1))}
            disabled={page >= totalPages}
            className="inline-flex items-center rounded-lg border border-edge bg-card px-2 py-1.5 text-content-2 transition hover:bg-card-hover disabled:opacity-30"
          >
            <ChevronRight className="h-4 w-4" />
          </button>
          <button
            onClick={() => setPage(totalPages)}
            disabled={page >= totalPages}
            className="rounded-lg border border-edge bg-card px-2.5 py-1.5 text-xs text-content-2 transition hover:bg-card-hover disabled:opacity-30"
          >
            Last
          </button>
        </div>
      </div>
    </div>
  );
}
