export type CreateInstitutionPayload = {
  name: string;
  code: string;
  description?: string;
  email_domain?: string;
};

export type Institution = {
  id: string;
  name: string;
  code: string;
  status: "pending" | "active" | "suspended";
  email_domain: string | null;
  description: string | null;
  created_at: string;
  updated_at: string;
};

// Creates a new institution and assigns current user as institution_admin
// Institution starts as pending until super_admin approves
export async function createInstitution(
  payload: CreateInstitutionPayload,
): Promise<void> {
  const res = await fetch("/api/institutions", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify(payload),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to create institution");
  }
}

// Fetch all institutions — super_admin only
export async function getInstitutions(): Promise<Institution[]> {
  const res = await fetch("/api/institutions", { cache: "no-store" });
  if (!res.ok) throw new Error("Failed to fetch institutions");
  const data = await res.json();
  return data.institutions;
}

// Approve a pending institution — super_admin only
export async function approveInstitution(id: string): Promise<void> {
  const res = await fetch(`/api/institutions/${id}/approve`, {
    method: "POST",
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to approve institution");
  }
}

// Reject a pending institution — super_admin only
export async function rejectInstitution(
  id: string,
  reason: string,
): Promise<void> {
  const res = await fetch(`/api/institutions/${id}/reject`, {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ reason }),
  });
  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Failed to reject institution");
  }
}
