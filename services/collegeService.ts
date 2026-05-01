export type College = {
  id: string;
  institution_id: string;
  name: string;
  code: string;
  email_domain: string | null;
  status: "active" | "inactive";
  created_at: string;
  updated_at: string;
};

export type CreateCollegePayload = {
  name: string;
  code: string;
  email_domain?: string;
};

// Fetch all colleges for the current institution
export async function getColleges(): Promise<College[]> {
  const res = await fetch("/api/colleges", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch colleges");
  const data = await res.json();
  return data.colleges;
}

// Create a new college under the current institution
export async function createCollege(
  payload: CreateCollegePayload,
): Promise<void> {
  const res = await fetch("/api/colleges", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to create college");
  }
}

// Invite a college admin by email
export async function inviteCollegeAdmin(
  email: string,
  collegeId: string,
): Promise<void> {
  const res = await fetch("/api/invite", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({
      email,
      role: "college_admin",
      college_id: collegeId,
    }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to invite college admin");
  }
}
