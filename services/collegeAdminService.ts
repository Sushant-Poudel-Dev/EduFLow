// All types and API calls for college admin operations

export type Department = {
  id: string;
  college_id: string;
  name: string;
  code: string | null;
  description: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type Program = {
  id: string;
  department_id: string;
  name: string;
  code: string | null;
  duration: number;
  degree_type: string;
  description: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type Semester = {
  id: string;
  program_id: string;
  number: number;
  start_date: string;
  end_date: string;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type Course = {
  id: string;
  code: string;
  title: string;
  description: string | null;
  credits: number;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type CreateDepartmentPayload = {
  name: string;
  code?: string;
  description?: string;
};

export type CreateProgramPayload = {
  department_id: string;
  name: string;
  code?: string;
  duration: number;
  degree_type: string;
  description?: string;
};

export type CreateSemesterPayload = {
  program_id: string;
  number: number;
  start_date: string;
  end_date: string;
};

export type CreateCoursePayload = {
  code: string;
  title: string;
  description?: string;
  credits: number;
};

// ── Departments ──────────────────────────────────────────

export async function getDepartments(): Promise<Department[]> {
  const res = await fetch("/api/departments", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch departments");
  const data = await res.json();
  return data.departments;
}

export async function createDepartment(
  payload: CreateDepartmentPayload,
): Promise<void> {
  const res = await fetch("/api/departments", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to create department");
  }
}

// ── Programs ─────────────────────────────────────────────

export async function getPrograms(departmentId: string): Promise<Program[]> {
  const res = await fetch(`/api/programs?department_id=${departmentId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch programs");
  const data = await res.json();
  return data.programs;
}

export async function createProgram(
  payload: CreateProgramPayload,
): Promise<void> {
  const res = await fetch("/api/programs", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to create program");
  }
}

// ── Semesters ────────────────────────────────────────────

export async function getSemesters(programId: string): Promise<Semester[]> {
  const res = await fetch(`/api/semesters?program_id=${programId}`, {
    cache: "no-store",
  });
  if (!res.ok) throw new Error("Failed to fetch semesters");
  const data = await res.json();
  return data.semesters;
}

export async function createSemester(
  payload: CreateSemesterPayload,
): Promise<void> {
  const res = await fetch("/api/semesters", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to create semester");
  }
}

// ── Courses ──────────────────────────────────────────────

export async function getCourses(): Promise<Course[]> {
  const res = await fetch("/api/courses", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch courses");
  const data = await res.json();
  return data.courses;
}

export async function createCourse(
  payload: CreateCoursePayload,
): Promise<void> {
  const res = await fetch("/api/courses", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to create course");
  }
}

// ── Invite teacher ───────────────────────────────────────

export async function inviteTeacher(
  email: string,
  departmentId: string,
): Promise<void> {
  const res = await fetch("/api/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      role: "teacher",
      department_id: departmentId,
    }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to invite teacher");
  }
}
