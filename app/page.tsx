"use client";

import { useAuth } from "@/context/AuthContext";
import ProtectedRoute from "@/features/auth/ProtectedRoute";

function HomeContent() {
  const { user, profile, roles, signOut } = useAuth();

  return (
    <main style={{ padding: 24, maxWidth: 720, margin: "40px auto" }}>
      <h1>Welcome to EduFlow</h1>

      {profile && (
        <section style={{ marginBottom: 24 }}>
          <h2>Your profile</h2>
          <p>
            <strong>Email:</strong> {profile.email}
          </p>
          {profile.phone_number && (
            <p>
              <strong>Phone:</strong> {profile.phone_number}
            </p>
          )}
          <p>
            <strong>Status:</strong> {profile.status}
          </p>
        </section>
      )}

      {roles.length > 0 && (
        <section style={{ marginBottom: 24 }}>
          <h2>Your roles</h2>
          <ul>
            {roles.map((role) => (
              <li key={role}>{role}</li>
            ))}
          </ul>
        </section>
      )}

      <p style={{ color: "#666", fontSize: 14 }}>
        Signed in as <strong>{user?.email}</strong>
      </p>

      <button
        onClick={signOut}
        style={{ marginTop: 16 }}
      >
        Sign out
      </button>
    </main>
  );
}

export default function Home() {
  return (
    <ProtectedRoute>
      <HomeContent />
    </ProtectedRoute>
  );
}
