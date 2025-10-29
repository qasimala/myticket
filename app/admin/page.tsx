"use client";

import { useQuery, useMutation } from "convex/react";
import { api } from "../../convex/_generated/api";
import type { Id } from "../../convex/_generated/dataModel";
import { useState } from "react";

export default function AdminPanel() {
  const currentUser = useQuery(api.users.current);
  const allUsers = useQuery(api.users.list);
  const updateRole = useMutation(api.users.updateRole);
  const removeUser = useMutation(api.users.remove);
  const [updatingUserId, setUpdatingUserId] = useState<string | null>(null);

  if (currentUser === undefined || allUsers === undefined) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 flex items-center justify-center">
        <div className="text-center">
          <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-indigo-600 mx-auto"></div>
          <p className="mt-4 text-gray-600">Loading...</p>
        </div>
      </div>
    );
  }

  if (!currentUser || (currentUser.role !== "admin" && currentUser.role !== "superadmin")) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 py-12 flex items-center justify-center">
        <div className="bg-white rounded-lg shadow-lg p-8 text-center">
          <div className="text-6xl mb-4">🚫</div>
          <h2 className="text-2xl font-bold text-gray-900 mb-2">Access Denied</h2>
          <p className="text-gray-600">You don't have permission to access this page.</p>
        </div>
      </div>
    );
  }

  const handleRoleChange = async (profileId: Id<"userProfiles">, newRole: "user" | "admin" | "superadmin") => {
    try {
      setUpdatingUserId(profileId);
      await updateRole({ profileId, role: newRole });
    } catch (error: any) {
      alert(error.message);
    } finally {
      setUpdatingUserId(null);
    }
  };

  const handleDeleteUser = async (profileId: Id<"userProfiles">, userName: string) => {
    if (confirm(`Are you sure you want to delete ${userName}? This will also delete all their events.`)) {
      try {
        await removeUser({ profileId });
      } catch (error: any) {
        alert(error.message);
      }
    }
  };

  const getRoleBadgeColor = (role: string) => {
    switch (role) {
      case "superadmin":
        return "bg-purple-100 text-purple-800";
      case "admin":
        return "bg-blue-100 text-blue-800";
      default:
        return "bg-gray-100 text-gray-800";
    }
  };

  return (
    <div className="p-6">
      <div className="max-w-7xl mx-auto">
        <div className="mb-8">
          <h1 className="text-4xl font-bold text-gray-900 mb-2">Admin Panel</h1>
          <p className="text-gray-600">Manage users and their roles</p>
        </div>

        <div className="bg-white rounded-lg shadow-lg overflow-hidden">
          <div className="overflow-x-auto">
            <table className="min-w-full divide-y divide-gray-200">
              <thead className="bg-gray-50">
                <tr>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    User
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Email
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Role
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Joined
                  </th>
                  <th className="px-6 py-3 text-left text-xs font-medium text-gray-500 uppercase tracking-wider">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody className="bg-white divide-y divide-gray-200">
                {allUsers.map((user) => (
                  <tr key={user._id} className={user._id === currentUser._id ? "bg-indigo-50" : ""}>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="flex items-center">
                        <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                          {user.name ? user.name[0].toUpperCase() : user.email[0].toUpperCase()}
                        </div>
                        <div className="ml-4">
                          <div className="text-sm font-medium text-gray-900">
                            {user.name || "No name"}
                            {user._id === currentUser._id && (
                              <span className="ml-2 text-xs text-indigo-600 font-semibold">
                                (You)
                              </span>
                            )}
                          </div>
                        </div>
                      </div>
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap">
                      <div className="text-sm text-gray-900">{user.email}</div>
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
                          )} border-0 cursor-pointer hover:opacity-80`}
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
                    <td className="px-6 py-4 whitespace-nowrap text-sm text-gray-500">
                      {new Date(user.createdAt).toLocaleDateString()}
                    </td>
                    <td className="px-6 py-4 whitespace-nowrap text-sm font-medium">
                      {currentUser.role === "superadmin" && user._id !== currentUser._id && (
                        <button
                          onClick={() => handleDeleteUser(user._id, user.name || user.email)}
                          className="text-red-600 hover:text-red-900"
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

        <div className="mt-8 bg-white rounded-lg shadow-lg p-6">
          <h2 className="text-xl font-bold text-gray-900 mb-4">Role Permissions</h2>
          <div className="space-y-3">
            <div className="flex items-start gap-3">
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-gray-100 text-gray-800">
                user
              </span>
              <p className="text-sm text-gray-600">
                Can create and manage their own events and tickets
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-blue-100 text-blue-800">
                admin
              </span>
              <p className="text-sm text-gray-600">
                Can manage all events and tickets, view user list
              </p>
            </div>
            <div className="flex items-start gap-3">
              <span className="text-xs px-3 py-1 rounded-full font-semibold bg-purple-100 text-purple-800">
                superadmin
              </span>
              <p className="text-sm text-gray-600">
                Full access: can manage users, change roles, and delete accounts
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

