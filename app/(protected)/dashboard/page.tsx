"use client";

import { useAuth } from "@/context/AuthContext";
import { BookOpen, Users, Clock, CheckCircle2, Bell } from "lucide-react";

const COURSES = [
  { name: "Introduction to Algebra", progress: 72 },
  { name: "Physics 101", progress: 45 },
  { name: "World History", progress: 88 },
  { name: "Chemistry Basics", progress: 30 },
];

const ACTIVITY = [
  {
    label: "Assignment published",
    sub: "Introduction to Algebra",
    time: "2h ago",
  },
  { label: "Course content updated", sub: "Physics 101", time: "5h ago" },
  {
    label: "Forum reply received",
    sub: "Chemistry Study Group",
    time: "1d ago",
  },
  { label: "Quiz results available", sub: "History Mid-term", time: "2d ago" },
];

export default function DashboardPage() {
  const { profile, roles } = useAuth();

  const displayName =
    profile?.email?.split("@")[0].replace(/[._]/g, " ") ?? "Student";
  const normalizedRoles = roles.map((r) => r.toLowerCase());
  const isTeacher = normalizedRoles.includes("teacher");
  const today = new Date().toLocaleDateString(undefined, {
    month: "short",
    day: "numeric",
    year: "numeric",
  });

  const stats = [
    {
      name: "Active Courses",
      value: "4",
      icon: BookOpen,
      sub: "+1 this month",
    },
    {
      name: "Assignments Due",
      value: "12",
      icon: Clock,
      sub: "3 due this week",
    },
    {
      name: "Total Students",
      value: "128",
      icon: Users,
      sub: "+4 this week",
      role: "teacher",
    },
  ].filter((s) => !s.role || normalizedRoles.includes(s.role));

  return (
    <div className='min-h-screen bg-slate-100 text-slate-900'>
      <div className='mx-auto max-w-6xl space-y-8 px-6 py-8'>
        <header className='rounded-3xl border border-slate-200 bg-white p-6 shadow-sm'>
          <div className='flex flex-col gap-5 md:flex-row md:items-end md:justify-between'>
            <div>
              <p className='text-xs font-semibold uppercase tracking-[0.16em] text-slate-500'>
                Overview
              </p>
              <h1 className='mt-2 text-3xl font-semibold capitalize text-slate-950'>
                Welcome back, {displayName}
              </h1>
              <p className='mt-2 text-sm text-slate-600'>
                {isTeacher
                  ? "Track teaching activity, assignments, and class engagement."
                  : "Track your learning progress, assignments, and updates."}
              </p>
            </div>
            <div className='flex items-center gap-2'>
              <div className='rounded-xl border border-slate-200 bg-slate-50 px-3 py-2 text-right'>
                <p className='text-[11px] font-medium uppercase tracking-wide text-slate-500'>
                  Today
                </p>
                <p className='text-sm font-semibold text-slate-800'>{today}</p>
              </div>
              <button
                className='rounded-xl border border-slate-200 bg-white p-2.5 text-slate-600 transition hover:bg-slate-50'
                aria-label='Notifications'
              >
                <Bell className='h-4 w-4' />
              </button>
            </div>
          </div>
          <div className='mt-5 inline-flex items-center gap-2 rounded-full border border-emerald-200 bg-emerald-50 px-3 py-1.5 text-xs font-medium text-emerald-700'>
            <CheckCircle2 className='h-3.5 w-3.5' />
            {profile?.status ?? "Active"}
          </div>
        </header>

        <div className='grid grid-cols-1 gap-4 md:grid-cols-3'>
          {stats.map((stat) => (
            <article
              key={stat.name}
              className='rounded-2xl border border-slate-200 bg-white p-5 shadow-sm'
            >
              <div className='flex items-center justify-between'>
                <span className='rounded-lg bg-slate-100 p-2 text-slate-700'>
                  <stat.icon
                    className='h-4 w-4'
                    strokeWidth={1.75}
                  />
                </span>
                <span className='text-xs font-medium text-slate-500'>
                  {stat.sub}
                </span>
              </div>
              <p className='mt-4 text-3xl font-semibold text-slate-900'>
                {stat.value}
              </p>
              <p className='mt-1 text-sm text-slate-600'>{stat.name}</p>
            </article>
          ))}
        </div>

        <div className='grid grid-cols-1 gap-5 lg:grid-cols-5'>
          <section className='lg:col-span-3 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='text-base font-semibold text-slate-900'>
                Course Progress
              </h2>
              <span className='text-xs font-medium text-slate-500'>
                {COURSES.length} active
              </span>
            </div>
            <div className='space-y-5'>
              {COURSES.map((course) => (
                <div key={course.name}>
                  <div className='flex justify-between items-baseline mb-2'>
                    <span className='text-sm font-medium text-slate-800'>
                      {course.name}
                    </span>
                    <span className='text-xs tabular-nums font-medium text-slate-600'>
                      {course.progress}%
                    </span>
                  </div>
                  <div className='h-2 w-full overflow-hidden rounded-full bg-slate-200'>
                    <div
                      className='h-full rounded-full bg-slate-900'
                      style={{ width: `${course.progress}%` }}
                    />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className='lg:col-span-2 rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
            <div className='mb-6 flex items-center justify-between'>
              <h2 className='text-base font-semibold text-slate-900'>
                Recent Activity
              </h2>
              <span className='text-xs font-medium text-slate-500'>Live</span>
            </div>
            <div className='space-y-1'>
              {ACTIVITY.map((item, i) => (
                <div
                  key={i}
                  className='flex items-start justify-between gap-3 rounded-xl border border-transparent px-2 py-2.5 transition hover:border-slate-200 hover:bg-slate-50'
                >
                  <div>
                    <p className='text-sm font-medium text-slate-800'>
                      {item.label}
                    </p>
                    <p className='mt-0.5 text-xs text-slate-600'>{item.sub}</p>
                  </div>
                  <span className='whitespace-nowrap pt-0.5 text-xs font-medium text-slate-500'>
                    {item.time}
                  </span>
                </div>
              ))}
            </div>
          </section>
        </div>

        <section className='rounded-2xl border border-slate-200 bg-white p-6 shadow-sm'>
          <h2 className='mb-5 text-base font-semibold text-slate-900'>Account</h2>
          <div className='grid grid-cols-1 gap-3 sm:grid-cols-3'>
            <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
              <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-500'>
                Email
              </p>
              <p className='truncate text-sm font-semibold text-slate-900'>
                {profile?.email ?? "—"}
              </p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
              <p className='mb-1 text-xs font-medium uppercase tracking-wide text-slate-500'>
                Status
              </p>
              <p className='text-sm font-semibold capitalize text-slate-900'>
                {profile?.status ?? "Active"}
              </p>
            </div>
            <div className='rounded-xl border border-slate-200 bg-slate-50 px-4 py-3'>
              <p className='mb-2 text-xs font-medium uppercase tracking-wide text-slate-500'>
                Roles
              </p>
              <div className='flex flex-wrap gap-1.5'>
                {(roles.length ? roles : ["student"]).map((role) => (
                  <span
                    key={role}
                    className='rounded-full border border-slate-300 bg-white px-2.5 py-0.5 text-xs font-medium capitalize text-slate-700'
                  >
                    {role}
                  </span>
                ))}
              </div>
            </div>
          </div>
        </section>
      </div>
    </div>
  );
}
