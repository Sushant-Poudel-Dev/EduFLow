"use client";

import { useEffect, useState, useCallback } from "react";
import {
  getDepartments,
  createDepartment,
  getPrograms,
  createProgram,
  getSemesters,
  createSemester,
  inviteTeacher,
  type Department,
  type Program,
  type Semester,
} from "@/services/collegeAdminService";
import {
  ChevronRight,
  Plus,
  Loader2,
  X,
  Mail,
  BookOpen,
  Layers,
  GraduationCap,
  Calendar,
} from "lucide-react";

// The page is a drill-down:
// Departments → Programs → Semesters
type View = "departments" | "programs" | "semesters";
type Modal =
  | "create_department"
  | "create_program"
  | "create_semester"
  | "invite_teacher"
  | null;

export default function CollegeAdminPage() {
  const [view, setView] = useState<View>("departments");
  const [modal, setModal] = useState<Modal>(null);
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [actionError, setActionError] = useState<string | null>(null);

  // Data
  const [departments, setDepartments] = useState<Department[]>([]);
  const [programs, setPrograms] = useState<Program[]>([]);
  const [semesters, setSemesters] = useState<Semester[]>([]);

  // Selected items for drill-down
  const [selectedDept, setSelectedDept] = useState<Department | null>(null);
  const [selectedProgram, setSelectedProgram] = useState<Program | null>(null);

  // Form state — departments
  const [deptName, setDeptName] = useState("");
  const [deptCode, setDeptCode] = useState("");
  const [deptDesc, setDeptDesc] = useState("");

  // Form state — programs
  const [progName, setProgName] = useState("");
  const [progCode, setProgCode] = useState("");
  const [progDuration, setProgDuration] = useState("");
  const [progDegreeType, setProgDegreeType] = useState("Bachelor");
  const [progDesc, setProgDesc] = useState("");

  // Form state — semesters
  const [semNumber, setSemNumber] = useState("");
  const [semStartDate, setSemStartDate] = useState("");
  const [semEndDate, setSemEndDate] = useState("");

  // Form state — invite
  const [inviteEmail, setInviteEmail] = useState("");

  // ── Loaders ──────────────────────────────────────────────

  const loadDepartments = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await getDepartments();
      setDepartments(data);
    } catch (err) {
      setError(
        err instanceof Error ? err.message : "Failed to load departments",
      );
    } finally {
      setLoading(false);
    }
  }, []);

  const loadPrograms = useCallback(async (departmentId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getPrograms(departmentId);
      setPrograms(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load programs");
    } finally {
      setLoading(false);
    }
  }, []);

  const loadSemesters = useCallback(async (programId: string) => {
    setLoading(true);
    setError(null);
    try {
      const data = await getSemesters(programId);
      setSemesters(data);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load semesters");
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    loadDepartments();
  }, [loadDepartments]);

  // ── Navigation ───────────────────────────────────────────

  const goToPrograms = useCallback(
    (dept: Department) => {
      setSelectedDept(dept);
      setView("programs");
      loadPrograms(dept.id);
    },
    [loadPrograms],
  );

  const goToSemesters = useCallback(
    (program: Program) => {
      setSelectedProgram(program);
      setView("semesters");
      loadSemesters(program.id);
    },
    [loadSemesters],
  );

  const goBack = useCallback(() => {
    if (view === "semesters") {
      setView("programs");
      setSelectedProgram(null);
    } else if (view === "programs") {
      setView("departments");
      setSelectedDept(null);
    }
  }, [view]);

  // ── Helpers ──────────────────────────────────────────────

  const resetModal = useCallback(() => {
    setModal(null);
    setActionError(null);
    setDeptName("");
    setDeptCode("");
    setDeptDesc("");
    setProgName("");
    setProgCode("");
    setProgDuration("");
    setProgDegreeType("Bachelor");
    setProgDesc("");
    setSemNumber("");
    setSemStartDate("");
    setSemEndDate("");
    setInviteEmail("");
  }, []);

  // ── Handlers ─────────────────────────────────────────────

  const handleCreateDepartment = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      setActionError(null);
      setSubmitting(true);
      try {
        await createDepartment({
          name: deptName,
          code: deptCode || undefined,
          description: deptDesc || undefined,
        });
        await loadDepartments();
        resetModal();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to create department",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [deptName, deptCode, deptDesc, loadDepartments, resetModal],
  );

  const handleCreateProgram = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDept) return;
      setActionError(null);
      setSubmitting(true);
      try {
        await createProgram({
          department_id: selectedDept.id,
          name: progName,
          code: progCode || undefined,
          duration: parseInt(progDuration),
          degree_type: progDegreeType,
          description: progDesc || undefined,
        });
        await loadPrograms(selectedDept.id);
        resetModal();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to create program",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedDept,
      progName,
      progCode,
      progDuration,
      progDegreeType,
      progDesc,
      loadPrograms,
      resetModal,
    ],
  );

  const handleCreateSemester = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedProgram) return;
      setActionError(null);
      setSubmitting(true);
      try {
        await createSemester({
          program_id: selectedProgram.id,
          number: parseInt(semNumber),
          start_date: semStartDate,
          end_date: semEndDate,
        });
        await loadSemesters(selectedProgram.id);
        resetModal();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to create semester",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [
      selectedProgram,
      semNumber,
      semStartDate,
      semEndDate,
      loadSemesters,
      resetModal,
    ],
  );

  const handleInviteTeacher = useCallback(
    async (e: React.FormEvent) => {
      e.preventDefault();
      if (!selectedDept) return;
      setActionError(null);
      setSubmitting(true);
      try {
        await inviteTeacher(inviteEmail, selectedDept.id);
        resetModal();
      } catch (err) {
        setActionError(
          err instanceof Error ? err.message : "Failed to send invite",
        );
      } finally {
        setSubmitting(false);
      }
    },
    [inviteEmail, selectedDept, resetModal],
  );

  // ── Breadcrumb ───────────────────────────────────────────

  const breadcrumb = (
    <div className='flex items-center gap-1.5 text-xs text-slate-400 mb-6'>
      <button
        onClick={() => {
          setView("departments");
          setSelectedDept(null);
          setSelectedProgram(null);
          loadDepartments();
        }}
        className='hover:text-slate-600 transition'
      >
        Departments
      </button>
      {selectedDept && (
        <>
          <ChevronRight className='h-3 w-3' />
          <button
            onClick={() => {
              setView("programs");
              setSelectedProgram(null);
              loadPrograms(selectedDept.id);
            }}
            className='hover:text-slate-600 transition'
          >
            {selectedDept.name}
          </button>
        </>
      )}
      {selectedProgram && (
        <>
          <ChevronRight className='h-3 w-3' />
          <span className='text-slate-600'>{selectedProgram.name}</span>
        </>
      )}
    </div>
  );

  // ── Render ───────────────────────────────────────────────

  return (
    <div className='max-w-4xl mx-auto space-y-6'>
      {/* Header */}
      <div className='flex items-end justify-between'>
        <div>
          <p className='text-xs font-medium tracking-widest uppercase text-slate-400 mb-1'>
            College Admin
          </p>
          <h1 className='text-2xl font-semibold tracking-tight text-slate-900'>
            {view === "departments" && "Departments"}
            {view === "programs" && selectedDept?.name}
            {view === "semesters" && selectedProgram?.name}
          </h1>
        </div>

        <div className='flex items-center gap-2'>
          {/* Back button */}
          {view !== "departments" && (
            <button
              onClick={goBack}
              className='rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50'
            >
              ← Back
            </button>
          )}

          {/* Invite teacher — available when viewing a department's programs */}
          {view === "programs" && selectedDept && (
            <button
              onClick={() => {
                setActionError(null);
                setModal("invite_teacher");
              }}
              className='inline-flex items-center gap-2 rounded-xl border border-slate-200 px-4 py-2 text-sm font-medium text-slate-600 transition hover:bg-slate-50'
            >
              <Mail className='h-4 w-4' />
              Invite teacher
            </button>
          )}

          {/* Primary create action per view */}
          <button
            onClick={() => {
              setActionError(null);
              if (view === "departments") setModal("create_department");
              if (view === "programs") setModal("create_program");
              if (view === "semesters") setModal("create_semester");
            }}
            className='inline-flex items-center gap-2 rounded-xl bg-slate-900 px-4 py-2 text-sm font-medium text-white transition hover:bg-slate-700'
          >
            <Plus className='h-4 w-4' />
            {view === "departments" && "Add department"}
            {view === "programs" && "Add program"}
            {view === "semesters" && "Add semester"}
          </button>
        </div>
      </div>

      {/* Breadcrumb */}
      {view !== "departments" && breadcrumb}

      {error && (
        <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </p>
      )}

      {/* Loading */}
      {loading ? (
        <div className='flex items-center justify-center h-48'>
          <Loader2 className='h-5 w-5 animate-spin text-slate-400' />
        </div>
      ) : (
        <>
          {/* ── Departments view ── */}
          {view === "departments" && (
            <>
              {departments.length === 0 ? (
                <EmptyState
                  icon={<Layers className='h-8 w-8 text-slate-300' />}
                  title='No departments yet'
                  sub='Add your first department to get started'
                />
              ) : (
                <div className='space-y-3'>
                  {departments.map((dept) => (
                    <ItemRow
                      key={dept.id}
                      title={dept.name}
                      sub={dept.code ?? ""}
                      meta={dept.description ?? ""}
                      onClick={() => goToPrograms(dept)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Programs view ── */}
          {view === "programs" && (
            <>
              {programs.length === 0 ? (
                <EmptyState
                  icon={<BookOpen className='h-8 w-8 text-slate-300' />}
                  title='No programs yet'
                  sub='Add programs under this department'
                />
              ) : (
                <div className='space-y-3'>
                  {programs.map((prog) => (
                    <ItemRow
                      key={prog.id}
                      title={prog.name}
                      sub={`${prog.degree_type} · ${prog.duration} years`}
                      meta={prog.code ?? ""}
                      onClick={() => goToSemesters(prog)}
                    />
                  ))}
                </div>
              )}
            </>
          )}

          {/* ── Semesters view ── */}
          {view === "semesters" && (
            <>
              {semesters.length === 0 ? (
                <EmptyState
                  icon={<Calendar className='h-8 w-8 text-slate-300' />}
                  title='No semesters yet'
                  sub='Add semesters for this program'
                />
              ) : (
                <div className='space-y-3'>
                  {semesters.map((sem) => (
                    <ItemRow
                      key={sem.id}
                      title={`Semester ${sem.number}`}
                      sub={`${sem.start_date} → ${sem.end_date}`}
                      meta={sem.status}
                    />
                  ))}
                </div>
              )}
            </>
          )}
        </>
      )}

      {/* ── Create department modal ── */}
      {modal === "create_department" && (
        <Modal
          title='Add department'
          onClose={resetModal}
        >
          <form
            onSubmit={handleCreateDepartment}
            className='space-y-4'
          >
            <Field
              label='Name'
              required
            >
              <input
                type='text'
                value={deptName}
                required
                onChange={(e) => setDeptName(e.target.value)}
                placeholder='Information Technology'
                className={inputClass}
              />
            </Field>
            <Field label='Code'>
              <input
                type='text'
                value={deptCode}
                onChange={(e) => setDeptCode(e.target.value.toUpperCase())}
                placeholder='IT'
                className={inputClass}
              />
            </Field>
            <Field label='Description'>
              <textarea
                value={deptDesc}
                rows={2}
                onChange={(e) => setDeptDesc(e.target.value)}
                placeholder='Brief description'
                className={`${inputClass} resize-none`}
              />
            </Field>
            <ModalActions
              onClose={resetModal}
              submitting={submitting}
              error={actionError}
              label='Create department'
            />
          </form>
        </Modal>
      )}

      {/* ── Create program modal ── */}
      {modal === "create_program" && (
        <Modal
          title='Add program'
          onClose={resetModal}
        >
          <form
            onSubmit={handleCreateProgram}
            className='space-y-4'
          >
            <Field
              label='Program name'
              required
            >
              <input
                type='text'
                value={progName}
                required
                onChange={(e) => setProgName(e.target.value)}
                placeholder='Bachelor of Information Management'
                className={inputClass}
              />
            </Field>
            <Field label='Code'>
              <input
                type='text'
                value={progCode}
                onChange={(e) => setProgCode(e.target.value.toUpperCase())}
                placeholder='BIM'
                className={inputClass}
              />
            </Field>
            <div className='grid grid-cols-2 gap-3'>
              <Field
                label='Degree type'
                required
              >
                <select
                  value={progDegreeType}
                  required
                  onChange={(e) => setProgDegreeType(e.target.value)}
                  className={inputClass}
                >
                  <option>Bachelor</option>
                  <option>Master</option>
                  <option>PhD</option>
                  <option>Diploma</option>
                  <option>Certificate</option>
                </select>
              </Field>
              <Field
                label='Duration (years)'
                required
              >
                <input
                  type='number'
                  value={progDuration}
                  required
                  min={1}
                  max={10}
                  onChange={(e) => setProgDuration(e.target.value)}
                  placeholder='4'
                  className={inputClass}
                />
              </Field>
            </div>
            <Field label='Description'>
              <textarea
                value={progDesc}
                rows={2}
                onChange={(e) => setProgDesc(e.target.value)}
                placeholder='Brief description'
                className={`${inputClass} resize-none`}
              />
            </Field>
            <ModalActions
              onClose={resetModal}
              submitting={submitting}
              error={actionError}
              label='Create program'
            />
          </form>
        </Modal>
      )}

      {/* ── Create semester modal ── */}
      {modal === "create_semester" && (
        <Modal
          title='Add semester'
          onClose={resetModal}
        >
          <form
            onSubmit={handleCreateSemester}
            className='space-y-4'
          >
            <Field
              label='Semester number'
              required
            >
              <input
                type='number'
                value={semNumber}
                required
                min={1}
                max={12}
                onChange={(e) => setSemNumber(e.target.value)}
                placeholder='1'
                className={inputClass}
              />
            </Field>
            <Field
              label='Start date'
              required
            >
              <input
                type='date'
                value={semStartDate}
                required
                onChange={(e) => setSemStartDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <Field
              label='End date'
              required
            >
              <input
                type='date'
                value={semEndDate}
                required
                onChange={(e) => setSemEndDate(e.target.value)}
                className={inputClass}
              />
            </Field>
            <ModalActions
              onClose={resetModal}
              submitting={submitting}
              error={actionError}
              label='Create semester'
            />
          </form>
        </Modal>
      )}

      {/* ── Invite teacher modal ── */}
      {modal === "invite_teacher" && (
        <Modal
          title='Invite teacher'
          onClose={resetModal}
        >
          <p className='text-xs text-slate-400 -mt-3 mb-4'>
            Inviting to{" "}
            <span className='font-medium text-slate-600'>
              {selectedDept?.name}
            </span>
          </p>
          <form
            onSubmit={handleInviteTeacher}
            className='space-y-4'
          >
            <Field
              label='Email address'
              required
            >
              <input
                type='email'
                value={inviteEmail}
                required
                onChange={(e) => setInviteEmail(e.target.value)}
                placeholder='teacher@university.edu'
                className={inputClass}
              />
            </Field>
            <ModalActions
              onClose={resetModal}
              submitting={submitting}
              error={actionError}
              label='Send invite'
              icon={<Mail className='h-4 w-4' />}
            />
          </form>
        </Modal>
      )}
    </div>
  );
}

// ── Reusable sub-components ───────────────────────────────

const inputClass =
  "w-full rounded-lg border border-slate-300 bg-white py-2.5 px-3 text-sm text-slate-900 outline-none transition focus:border-blue-500 focus:ring-2 focus:ring-blue-100";

function EmptyState({
  icon,
  title,
  sub,
}: {
  icon: React.ReactNode;
  title: string;
  sub: string;
}) {
  return (
    <div className='flex flex-col items-center justify-center rounded-2xl border border-dashed border-slate-200 bg-white py-16 text-center'>
      <div className='mb-3'>{icon}</div>
      <p className='text-sm font-medium text-slate-600'>{title}</p>
      <p className='text-xs text-slate-400 mt-1'>{sub}</p>
    </div>
  );
}

function ItemRow({
  title,
  sub,
  meta,
  onClick,
}: {
  title: string;
  sub: string;
  meta: string;
  onClick?: () => void;
}) {
  return (
    <div
      onClick={onClick}
      className={`bg-white border border-slate-200 rounded-2xl p-5 flex items-center justify-between gap-4 ${
        onClick
          ? "cursor-pointer hover:border-slate-300 hover:shadow-sm transition"
          : ""
      }`}
    >
      <div>
        <p className='text-sm font-semibold text-slate-900'>{title}</p>
        {sub && <p className='text-xs text-slate-500 mt-0.5'>{sub}</p>}
        {meta && <p className='text-xs text-slate-400 mt-0.5'>{meta}</p>}
      </div>
      {onClick && <ChevronRight className='h-4 w-4 text-slate-300 shrink-0' />}
    </div>
  );
}

function Modal({
  title,
  onClose,
  children,
}: {
  title: string;
  onClose: () => void;
  children: React.ReactNode;
}) {
  return (
    <div className='fixed inset-0 z-50 flex items-center justify-center bg-black/40 p-4'>
      <div className='w-full max-w-sm rounded-2xl border border-slate-200 bg-white p-6 shadow-xl'>
        <div className='flex items-center justify-between mb-5'>
          <h2 className='text-base font-semibold text-slate-900'>{title}</h2>
          <button
            type='button'
            onClick={onClose}
            className='flex h-7 w-7 items-center justify-center rounded-lg text-slate-400 hover:bg-slate-100 transition'
          >
            <X className='h-4 w-4' />
          </button>
        </div>
        {children}
      </div>
    </div>
  );
}

function Field({
  label,
  required,
  children,
}: {
  label: string;
  required?: boolean;
  children: React.ReactNode;
}) {
  return (
    <label className='block'>
      <span className='mb-1.5 block text-sm font-medium text-slate-700'>
        {label} {required && <span className='text-red-500'>*</span>}
      </span>
      {children}
    </label>
  );
}

function ModalActions({
  onClose,
  submitting,
  error,
  label,
  icon,
}: {
  onClose: () => void;
  submitting: boolean;
  error: string | null;
  label: string;
  icon?: React.ReactNode;
}) {
  return (
    <>
      {error && (
        <p className='rounded-lg border border-red-200 bg-red-50 px-3 py-2 text-sm text-red-700'>
          {error}
        </p>
      )}
      <div className='flex gap-2 pt-1'>
        <button
          type='button'
          onClick={onClose}
          className='flex-1 rounded-lg border border-slate-200 py-2.5 text-sm font-medium text-slate-600 transition hover:bg-slate-50'
        >
          Cancel
        </button>
        <button
          type='submit'
          disabled={submitting}
          className='flex-1 inline-flex items-center justify-center gap-2 rounded-lg bg-slate-900 py-2.5 text-sm font-medium text-white transition hover:bg-slate-700 disabled:opacity-70'
        >
          {submitting ? (
            <Loader2 className='h-4 w-4 animate-spin' />
          ) : (
            <>
              {icon}
              {label}
            </>
          )}
        </button>
      </div>
    </>
  );
}
