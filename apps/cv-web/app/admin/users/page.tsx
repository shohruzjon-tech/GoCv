"use client";

import { useEffect, useState } from "react";
import { adminApi } from "@/lib/api";
import { User } from "@/types";
import { Shield, ShieldOff, Trash2, UserCheck, UserX, Key } from "lucide-react";
import toast from "react-hot-toast";

export default function AdminUsersPage() {
  const [users, setUsers] = useState<User[]>([]);
  const [total, setTotal] = useState(0);
  const [page, setPage] = useState(1);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadUsers();
  }, [page]);

  const loadUsers = async () => {
    try {
      const res = await adminApi.getUsers(page, 20);
      setUsers(res.data.users);
      setTotal(res.data.total);
    } catch {
      toast.error("Failed to load users");
    } finally {
      setLoading(false);
    }
  };

  const toggleActive = async (id: string, currentlyActive: boolean) => {
    try {
      await adminApi.toggleUserActive(id, !currentlyActive);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? ({ ...u, isActive: !currentlyActive } as any) : u,
        ),
      );
      toast.success(currentlyActive ? "User deactivated" : "User activated");
    } catch {
      toast.error("Failed to update user");
    }
  };

  const changeRole = async (id: string, role: string) => {
    try {
      await adminApi.changeUserRole(id, role);
      setUsers((prev) =>
        prev.map((u) =>
          u._id === id ? { ...u, role: role as "user" | "admin" } : u,
        ),
      );
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
      toast.success("User deleted");
    } catch {
      toast.error("Failed to delete user");
    }
  };

  const terminateAllSessions = async (userId: string) => {
    try {
      await adminApi.terminateAllUserSessions(userId);
      toast.success("All sessions terminated");
    } catch {
      toast.error("Failed to terminate sessions");
    }
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="h-8 w-8 animate-spin rounded-full border-4 border-orange-500 border-t-transparent" />
      </div>
    );
  }

  return (
    <div>
      <div className="mb-6 flex items-center justify-between">
        <div>
          <h1 className="text-2xl font-bold text-content">Users ({total})</h1>
          <p className="text-sm text-content-3">
            Manage user accounts and access
          </p>
        </div>
      </div>

      <div className="overflow-hidden rounded-2xl border border-edge bg-card">
        <table className="w-full">
          <thead>
            <tr className="border-b border-edge bg-card">
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                User
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                Role
              </th>
              <th className="px-6 py-3 text-left text-xs font-medium uppercase text-content-3">
                Status
              </th>
              <th className="px-6 py-3 text-right text-xs font-medium uppercase text-content-3">
                Actions
              </th>
            </tr>
          </thead>
          <tbody className="divide-y divide-edge">
            {users.map((user) => (
              <tr key={user._id} className="hover:bg-card-hover">
                <td className="px-6 py-4">
                  <div className="flex items-center gap-3">
                    {user.avatar ? (
                      <img
                        src={user.avatar}
                        alt=""
                        className="h-9 w-9 rounded-full"
                      />
                    ) : (
                      <div className="flex h-9 w-9 items-center justify-center rounded-full bg-indigo-600/30 text-indigo-300 ring-1 ring-indigo-500/30 text-sm font-medium">
                        {user.name?.charAt(0)}
                      </div>
                    )}
                    <div>
                      <p className="font-medium text-content">{user.name}</p>
                      <p className="text-xs text-content-3">{user.email}</p>
                    </div>
                  </div>
                </td>
                <td className="px-6 py-4">
                  <select
                    value={user.role}
                    onChange={(e) => changeRole(user._id, e.target.value)}
                    className="rounded-lg border border-edge bg-card text-content px-2 py-1 text-xs font-medium"
                  >
                    <option value="user">User</option>
                    <option value="admin">Admin</option>
                  </select>
                </td>
                <td className="px-6 py-4">
                  <span
                    className={`inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-medium ${
                      (user as any).isActive !== false
                        ? "bg-emerald-500/10 text-emerald-400 ring-1 ring-emerald-500/20"
                        : "bg-red-500/10 text-red-400 ring-1 ring-red-500/20"
                    }`}
                  >
                    {(user as any).isActive !== false ? "Active" : "Inactive"}
                  </span>
                </td>
                <td className="px-6 py-4">
                  <div className="flex items-center justify-end gap-1">
                    <button
                      onClick={() =>
                        toggleActive(user._id, (user as any).isActive !== false)
                      }
                      className="rounded-lg p-2 text-content-3 transition hover:bg-card-hover hover:text-content-2"
                      title={
                        (user as any).isActive !== false
                          ? "Deactivate"
                          : "Activate"
                      }
                    >
                      {(user as any).isActive !== false ? (
                        <UserX className="h-4 w-4" />
                      ) : (
                        <UserCheck className="h-4 w-4" />
                      )}
                    </button>
                    <button
                      onClick={() => terminateAllSessions(user._id)}
                      className="rounded-lg p-2 text-content-3 transition hover:bg-orange-500/10 hover:text-orange-400"
                      title="Terminate all sessions"
                    >
                      <Key className="h-4 w-4" />
                    </button>
                    <button
                      onClick={() => deleteUser(user._id)}
                      className="rounded-lg p-2 text-content-3 transition hover:bg-red-500/10 hover:text-red-400"
                      title="Delete user"
                    >
                      <Trash2 className="h-4 w-4" />
                    </button>
                  </div>
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>

      {/* Pagination */}
      {total > 20 && (
        <div className="mt-4 flex items-center justify-center gap-2">
          <button
            onClick={() => setPage((p) => Math.max(1, p - 1))}
            disabled={page === 1}
            className="rounded-lg border border-edge text-content-2 hover:bg-card-hover px-4 py-2 text-sm disabled:opacity-50"
          >
            Previous
          </button>
          <span className="text-sm text-content-3">
            Page {page} of {Math.ceil(total / 20)}
          </span>
          <button
            onClick={() => setPage((p) => p + 1)}
            disabled={page * 20 >= total}
            className="rounded-lg border border-edge text-content-2 hover:bg-card-hover px-4 py-2 text-sm disabled:opacity-50"
          >
            Next
          </button>
        </div>
      )}
    </div>
  );
}
