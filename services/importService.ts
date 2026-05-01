export type ImportResult = {
  success: number;
  failed: number;
  errors: string[];
};

// Parses a CSV file into an array of row objects
// First row is treated as headers
export function parseCSV(text: string): Record<string, string>[] {
  const lines = text
    .trim()
    .split("\n")
    .map((l) => l.trim())
    .filter(Boolean);
  if (lines.length < 2) return [];

  // Normalize headers — lowercase, trim whitespace
  const headers = lines[0].split(",").map((h) => h.trim().toLowerCase());

  return lines.slice(1).map((line) => {
    const values = line.split(",").map((v) => v.trim());
    return headers.reduce(
      (row, header, i) => {
        row[header] = values[i] ?? "";
        return row;
      },
      {} as Record<string, string>,
    );
  });
}

// Sends parsed student rows to the import API
export async function importStudents(
  students: Record<string, string>[],
  classId: string,
): Promise<ImportResult> {
  const res = await fetch("/api/import/students", {
    method: "POST",
    headers: { "Content-Type": "application/json" },
    body: JSON.stringify({ students, class_id: classId }),
  });

  if (!res.ok) {
    const data = await res.json();
    throw new Error(data.error ?? "Import failed");
  }

  const data = await res.json();
  return data.results;
}
