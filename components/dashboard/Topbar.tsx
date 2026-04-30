"use client";

import { useAuth } from "@/context/AuthContext";
import { LogOut, User, Bell } from "lucide-react";

export default function Topbar() {
  const { profile, signOut } = useAuth();

  return (
    <header className='h-16 bg-white/80 backdrop-blur-md border-b border-slate-200 fixed top-0 right-0 left-0 md:left-64 z-10 px-6 flex items-center justify-between'>
      <div className='flex items-center gap-4'>
        <h2 className='text-lg font-semibold text-slate-800'>
          Welcome back,{" "}
          <span className='text-blue-600'>
            {profile?.email?.split("@")[0] || "User"}
          </span>
        </h2>
      </div>

      <div className='flex items-center gap-4'>
        <button className='p-2 text-slate-400 hover:text-blue-600 transition-colors relative'>
          <Bell className='w-5 h-5' />
          <span className='absolute top-2 right-2 w-2 h-2 bg-red-500 rounded-full border-2 border-white'></span>
        </button>

        <div className='h-8 w-px bg-slate-200 mx-2'></div>

        <div className='flex items-center gap-3'>
          <div className='flex flex-col items-end hidden sm:flex'>
            <span className='text-sm font-medium text-slate-900'>
              {profile?.email}
            </span>
            <span className='text-xs text-slate-500 capitalize'>
              {profile?.status || "Active"}
            </span>
          </div>
          <div className='w-10 h-10 rounded-full bg-gradient-to-br from-blue-500 to-indigo-600 flex items-center justify-center text-white shadow-md'>
            <User className='w-6 h-6' />
          </div>
          <button
            onClick={signOut}
            className='p-2 text-slate-400 hover:text-red-600 transition-colors'
            title='Sign Out'
          >
            <LogOut className='w-5 h-5' />
          </button>
        </div>
      </div>
    </header>
  );
}
