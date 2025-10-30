"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";
import { ShieldAlert } from "lucide-react";

export default function AdminPanel() {
  const currentUser = useQuery(api.users.current);
  const allUsers = useQuery(api.users.list);
  const updateRole = useMutation(api.users.updateRole);
  const deleteUser = useMutation(api.users.deleteUser);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  if (currentUser === undefined || allUsers === undefined) {
    return (
      <div className="flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-400 mx-auto"></div>
          <p className="mt-4 text-slate-400">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "superadmin")) {
    return (
      <div className="rounded-3xl border border-red-500/20 bg-red-500/10 px-10 py-16 text-center text-red-100 shadow-xl backdrop-blur-xl">
        <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-full bg-red-500/20 text-3xl text-red-200">
          <ShieldAlert className="h-8 w-8" />
        </div>
        <h2 className="mt-6 text-2xl font-semibold">Access Denied</h2>
        <p className="mt-3 text-sm text-red-100/80">
          You don&apos;t have permission to access this page.
        </p>
      </div>
    );
  }

  const handleRoleChange = async (userId: Id<"userProfiles">, newRole: "user" | "admin" | "superadmin") => {
    try {
      setUpdatingUserId(userId);
      await updateRole({ userId, role: newRole });
    } catch (error: unknown) {
      alert((error as Error).message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (userId: Id<"userProfiles">, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This will also delete all their events.`)) {
      try {
        await deleteUser({ userId });
      } catch (error: unknown) {
        alert((error as Error).message);
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-500/20 text-purple-200";
      case "admin":
        return "bg-sky-500/20 text-sky-200";
      default:
        return "bg-slate-500/20 text-slate-200";
    }
  };

  return (
    <div className="w-full">
      <div className="mb-8">
        <h1 className="text-4xl font-bold text-slate-50 mb-2">Admin Panel</h1>
        <p className="text-slate-400">Manage users and their roles</p>
      </div>

      <div className="border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg overflow-hidden">
        <div className="overflow-x-auto">
          <table className="min-w-full divide-y divide-white/10">
            <thead className="bg-white/5">
              <tr>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  User
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Email
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Role
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Joined
                </th>
                <th className="px-6 py-3 text-left text-xs font-medium text-slate-400 uppercase tracking-wider">
                  Actions
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-white/10">
              {allUsers.map((user) => (
                <tr key={user._id} className={user._id === currentUser._id ? "bg-slate-800/50" : ""}>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="flex items-center">
                      <div className="w-10 h-10 bg-indigo-500 rounded-full flex items-center justify-center text-white font-semibold">
                        {user.name ? user.name[0].toUpperCase() : user.email ? user.email[0].toUpperCase() : '?'}
                      </div>
                      <div className="ml-4">
                        <div className="text-sm font-medium text-slate-200">
                          {user.name || "No name"}
                          {user._id === currentUser._id && (
                            <span className="ml-2 text-xs text-indigo-400 font-semibold">
                              (You)
                            </span>
                          )}
                        </div>
                      </div>
                    </div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    <div className="text-sm text-slate-300">{user.email || 'No email'}</div>
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap">
                    {currentUser.role === "superadmin" && user._id !== currentUser._id ? (
                      <select
                        value={user.role}
                        onChange={(e) =>
                          handleRoleChange(
                            user._id,
                            e.target.value as "user" | "admin" | "superadmin"
                          )
                        }
                        disabled={updatingUserId === user._id}
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getRoleBadgeColor(
                          user.role
                        )} border-0 cursor-pointer hover:opacity-80 bg-slate-800 border-slate-700`}
                      >
                        <option value="user">user</option>
                        <option value="admin">admin</option>
                        <option value="superadmin">superadmin</option>
                      </select>
                    ) : (
                      <span
                        className={`text-xs px-3 py-1 rounded-full font-semibold ${getRoleBadgeColor(
                          user.role
                        )}`}
                      >
                        {user.role}
                      </span>
                    )}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm text-slate-400">
                    {new Date(user.createdAt).toLocaleDateString()}
                  </td>
                  <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                    {currentUser.role === "superadmin" && user._id !== currentUser._id && (
                      <button
                        onClick={() => handleDeleteUser(user._id, user.name || user.email || 'user')}
                        className="text-red-500 hover:text-red-400"
                      >
                        Delete
                      </button>
                    )}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>

      <div className="mt-8 border border-white/10 rounded-2xl bg-slate-900/80 shadow-lg p-6">
        <h2 className="text-xl font-bold text-slate-50 mb-4">Role Permissions</h2>
        <div className="space-y-3">
          <div className="flex items-start gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getRoleBadgeColor("user")}`}>
              user
            </span>
            <p className="text-sm text-slate-400">
              Can create and manage their own events and tickets
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getRoleBadgeColor("admin")}`}>
              admin
            </span>
            <p className="text-sm text-slate-400">
              Can manage all events and tickets, view user list
            </p>
          </div>
          <div className="flex items-start gap-3">
            <span className={`text-xs px-3 py-1 rounded-full font-semibold ${getRoleBadgeColor("superadmin")}`}>
              superadmin
            </span>
            <p className="text-sm text-slate-400">
              Full access: can manage users, change roles, and delete accounts
            </p>
          </div>
        </div>
      </div>
    </div>
  );
}

