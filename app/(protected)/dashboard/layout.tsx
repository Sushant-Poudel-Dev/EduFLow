"use client";

import Sidebar from "@/components/dashboard/Sidebar";
import Topbar from "@/components/dashboard/Topbar";

export default function DashboardLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  // ProtectedRoute is handled by app/(protected)/layout.tsx
  // This layout only handles the dashboard UI chrome
  return (
    <div className='min-h-screen bg-slate-50'>
      <Sidebar />
      <div className='md:pl-64 flex flex-col min-h-screen'>
        <Topbar />
        <main className='flex-1 pt-16 p-6'>
          <div className='max-w-7xl mx-auto animate-in fade-in slide-in-from-bottom-4 duration-700'>
            {children}
          </div>
        </main>
      </div>
    </div>
  );
}
