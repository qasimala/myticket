"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useQuery } from "convex/react";
import { api } from "../../convex/_generated/api";
import { Sparkles, CalendarDays, ShoppingCart, User, Menu } from "lucide-react";

interface BottomNavigationProps {
  onMenuClick: () => void;
}

export default function BottomNavigation({ onMenuClick }: BottomNavigationProps) {
  const pathname = usePathname();
  const cart = useQuery(api.cart.getCart);

  const cartItems = Array.isArray(cart) ? cart : [];
  const cartCount = cartItems.reduce(
    (sum: number, item: any) => sum + (item?.quantity ?? 0),
    0
  );

  const navItems = [
    {
      name: "Discover",
      path: "/",
      icon: Sparkles,
    },
    {
      name: "My Bookings",
      path: "/my-bookings",
      icon: CalendarDays,
    },
    {
      name: "Cart",
      path: "/cart",
      icon: ShoppingCart,
      badge: cartCount > 0 ? cartCount : undefined,
    },
    {
      name: "Profile",
      path: "/profile",
      icon: User,
    },
  ];

  const isActive = (path: string) => {
    if (path === "/") {
      return pathname === "/";
    }
    return pathname.startsWith(path);
  };

  return (
    <nav className="fixed inset-x-0 bottom-0 z-50 border-t border-white/10 bg-slate-950/95 backdrop-blur-xl lg:hidden">
      <div className="flex h-16 items-center justify-around px-2">
        {navItems.map((item) => {
          const active = isActive(item.path);
          const Icon = item.icon;

          return (
            <Link
              key={item.path}
              href={item.path}
              className={`relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 transition-colors ${
                active
                  ? "text-indigo-400"
                  : "text-slate-400 hover:text-slate-300"
              }`}
            >
              <div className="relative">
                <Icon className="h-5 w-5" strokeWidth={active ? 2.5 : 2} />
                {item.badge && item.badge > 0 && (
                  <span className="absolute -right-2 -top-2 flex min-w-[1.25rem] h-5 items-center justify-center rounded-full bg-indigo-500 text-[10px] font-bold text-white px-1">
                    {item.badge > 9 ? "9+" : item.badge}
                  </span>
                )}
              </div>
              <span
                className={`text-[10px] font-medium ${
                  active ? "text-indigo-400" : "text-slate-400"
                }`}
              >
                {item.name}
              </span>
              {active && (
                <div className="absolute -top-1 left-1/2 h-1 w-1 -translate-x-1/2 rounded-full bg-indigo-400" />
              )}
            </Link>
          );
        })}
        
        {/* Menu button */}
        <button
          onClick={onMenuClick}
          className="relative flex flex-col items-center justify-center gap-1 rounded-xl px-3 py-2 text-slate-400 transition-colors hover:text-slate-300"
        >
          <Menu className="h-5 w-5" strokeWidth={2} />
          <span className="text-[10px] font-medium">Menu</span>
        </button>
      </div>
    </nav>
  );
}

