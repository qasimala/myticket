"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";

interface SidebarProps {
  isOpen: boolean;
  onClose: () => void;
}

export default function Sidebar({ isOpen, onClose }: SidebarProps) {
  const pathname = usePathname();
  const currentUser = useQuery(api.users.current);

  const isActive = (path: string) => pathname === path;

  const navItems = [
    {
      name: "Events",
      path: "/",
      icon: "🎫",
      description: "Browse all events",
    },
    {
      name: "My Events",
      path: "/my-events",
      icon: "📋",
      description: "Events you created",
      requireAuth: true,
    },
    {
      name: "Create Event",
      path: "/create",
      icon: "➕",
      description: "Create a new event",
      requireAuth: true,
    },
  ];

  const adminItems = [
    {
      name: "Admin Panel",
      path: "/admin",
      icon: "👥",
      description: "Manage users",
      requireAdmin: true,
    },
  ];

  const isAdmin = currentUser && (currentUser.role === "admin" || currentUser.role === "superadmin");

  return (
    <>
      {/* Mobile overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black bg-opacity-50 z-40 lg:hidden"
          onClick={onClose}
        />
      )}

      {/* Sidebar */}
      <aside
        className={`fixed top-0 left-0 h-full w-64 bg-white border-r border-gray-200 z-50 transform transition-transform duration-300 ease-in-out ${
          isOpen ? "translate-x-0" : "-translate-x-full"
        } lg:translate-x-0 lg:static lg:z-0`}
      >
        <div className="flex flex-col h-full">
          {/* Logo section */}
          <div className="p-6 border-b border-gray-200">
            <Link href="/" className="flex items-center gap-3" onClick={onClose}>
              <div className="text-3xl">🎫</div>
              <div>
                <h1 className="text-xl font-bold text-gray-900">MyTicket</h1>
                <p className="text-xs text-gray-500">Event Management</p>
              </div>
            </Link>
          </div>

          {/* Navigation */}
          <nav className="flex-1 overflow-y-auto p-4">
            <div className="space-y-1">
              {navItems.map((item) => {
                if (item.requireAuth && !currentUser) return null;

                return (
                  <Link
                    key={item.path}
                    href={item.path}
                    onClick={onClose}
                    className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                      isActive(item.path)
                        ? "bg-indigo-50 text-indigo-600"
                        : "text-gray-700 hover:bg-gray-100"
                    }`}
                  >
                    <span className="text-xl">{item.icon}</span>
                    <div className="flex-1">
                      <div className="font-medium">{item.name}</div>
                      <div className="text-xs text-gray-500">{item.description}</div>
                    </div>
                  </Link>
                );
              })}
            </div>

            {isAdmin && (
              <>
                <div className="my-4 border-t border-gray-200"></div>
                <div className="space-y-1">
                  <div className="px-4 py-2 text-xs font-semibold text-gray-500 uppercase">
                    Administration
                  </div>
                  {adminItems.map((item) => (
                    <Link
                      key={item.path}
                      href={item.path}
                      onClick={onClose}
                      className={`flex items-center gap-3 px-4 py-3 rounded-lg transition-colors ${
                        isActive(item.path)
                          ? "bg-purple-50 text-purple-600"
                          : "text-gray-700 hover:bg-gray-100"
                      }`}
                    >
                      <span className="text-xl">{item.icon}</span>
                      <div className="flex-1">
                        <div className="font-medium">{item.name}</div>
                        <div className="text-xs text-gray-500">{item.description}</div>
                      </div>
                    </Link>
                  ))}
                </div>
              </>
            )}
          </nav>

          {/* User section at bottom */}
          {currentUser && (
            <div className="p-4 border-t border-gray-200">
              <div className="flex items-center gap-3 px-3 py-2">
                <div className="w-10 h-10 bg-indigo-600 rounded-full flex items-center justify-center text-white font-semibold">
                  {currentUser.name ? currentUser.name[0].toUpperCase() : "U"}
                </div>
                <div className="flex-1 min-w-0">
                  <div className="text-sm font-medium text-gray-900 truncate">
                    {currentUser.name || "User"}
                  </div>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs px-2 py-0.5 rounded-full font-semibold ${
                        currentUser.role === "superadmin"
                          ? "bg-purple-100 text-purple-800"
                          : currentUser.role === "admin"
                          ? "bg-blue-100 text-blue-800"
                          : "bg-gray-100 text-gray-800"
                      }`}
                    >
                      {currentUser.role}
                    </span>
                  </div>
                </div>
              </div>
            </div>
          )}
        </div>
      </aside>
    </>
  );
}

