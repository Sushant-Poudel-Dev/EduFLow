"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/context/AuthContext";
import {
  LayoutDashboard,
  BookOpen,
  Settings,
  Users,
  GraduationCap,
  Building2,
} from "lucide-react";
import { clsx } from "clsx";

const navigation = [
  { name: "Dashboard", href: "/dashboard", icon: LayoutDashboard },
  {
    name: "Institution Admin",
    href: "/institution-admin",
    icon: Building2,
    roles: ["institution_admin", "super_admin"],
  },
  {
    name: "College Admin",
    href: "/college-admin",
    icon: GraduationCap,
    roles: ["college_admin", "institution_admin", "super_admin"],
  },
  { name: "My Courses", href: "/dashboard/courses", icon: BookOpen },
  {
    name: "Students",
    href: "/dashboard/students",
    icon: Users,
    roles: ["teacher", "institution_admin", "super_admin"],
  },
  {
    name: "Teachers",
    href: "/dashboard/teachers",
    icon: GraduationCap,
    roles: ["institution_admin", "super_admin"],
  },
  { name: "Settings", href: "/dashboard/settings", icon: Settings },
];

export default function Sidebar() {
  const pathname = usePathname();
  const { roles } = useAuth();

  const filteredNavigation = navigation.filter((item) => {
    if (!item.roles) return true;
    const normalized = roles.map((r) => r.toLowerCase());
    return item.roles.some((role) => normalized.includes(role.toLowerCase()));
  });

  return (
    <aside className="w-64 bg-slate-900 text-white h-screen fixed left-0 top-0 hidden md:flex flex-col border-r border-slate-800">
      <div className="p-6">
        <h1 className="text-2xl font-bold bg-gradient-to-r from-blue-400 to-indigo-400 bg-clip-text text-transparent">
          EduFlow
        </h1>
      </div>
      <nav className="flex-1 px-4 space-y-1 mt-4">
        {filteredNavigation.map((item) => {
          const isActive = pathname === item.href;
          return (
            <Link
              key={item.name}
              href={item.href}
              className={clsx(
                "flex items-center gap-3 px-3 py-2 rounded-lg transition-all duration-200 group",
                isActive 
                  ? "bg-blue-600 text-white shadow-lg shadow-blue-500/20" 
                  : "text-slate-400 hover:text-white hover:bg-slate-800"
              )}
            >
              <item.icon className={clsx("w-5 h-5", isActive ? "text-white" : "text-slate-400 group-hover:text-blue-400")} />
              <span className="font-medium">{item.name}</span>
            </Link>
          );
        })}
      </nav>
      <div className="p-4 border-t border-slate-800">
        <p className="text-xs text-slate-500 px-3 uppercase tracking-wider font-semibold">
          System Status: Online
        </p>
      </div>
    </aside>
  );
}
