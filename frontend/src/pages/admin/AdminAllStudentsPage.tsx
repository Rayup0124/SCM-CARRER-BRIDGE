import { useState, useEffect } from 'react';
import PageShell from '../../components/PageShell';
import api from '../../services/api';

interface Student {
  _id: string;
  name: string;
  email: string;
  studentId: string;
  programme: string;
  skills: string[];
  resumeUrl?: string;
  resumeUrls?: string[];
  createdAt: string;
}

const AdminAllStudentsPage = () => {
  const [students, setStudents] = useState<Student[]>([]);
  const [loading, setLoading] = useState(true);
  const [searchQuery, setSearchQuery] = useState('');
  const [programmeFilter, setProgrammeFilter] = useState('all');

  useEffect(() => {
    const fetchStudents = async () => {
      try {
        const res = await api.get('/admin/students/all');
        setStudents(res.data || []);
      } catch {
        setStudents([]);
      } finally {
        setLoading(false);
      }
    };
    fetchStudents();
  }, []);

  const programmes = [...new Set(students.map((s) => s.programme))].sort();

  const filteredStudents = students.filter((student) => {
    const matchesSearch =
      student.name.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.email.toLowerCase().includes(searchQuery.toLowerCase()) ||
      student.studentId.toLowerCase().includes(searchQuery.toLowerCase());
    const matchesProgramme = programmeFilter === 'all' || student.programme === programmeFilter;
    return matchesSearch && matchesProgramme;
  });

  return (
    <PageShell
      title="All Students"
      subtitle="Complete registry of all registered students on the platform."
    >
      {/* Summary Cards */}
      <div className="mb-6 grid gap-4 md:grid-cols-3">
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Total Students</p>
          <p className="mt-1 text-2xl font-bold text-sky-600">{students.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Programmes</p>
          <p className="mt-1 text-2xl font-bold text-slate-900">{programmes.length}</p>
        </div>
        <div className="rounded-xl border border-slate-200 bg-white p-5 shadow-sm">
          <p className="text-sm text-slate-500">Students with Resume</p>
          <p className="mt-1 text-2xl font-bold text-emerald-600">
            {
              students.filter(
                (s) => (s.resumeUrls && s.resumeUrls.length > 0) || !!s.resumeUrl,
              ).length
            }
          </p>
        </div>
      </div>

      {/* Filters */}
      <div className="mb-4 flex flex-wrap gap-4">
        <input
          type="text"
          placeholder="Search by name, email, or student ID..."
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          className="flex-1 rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-900 outline-none focus:border-sky-500 focus:ring-1 focus:ring-sky-500"
        />
        <select
          value={programmeFilter}
          onChange={(e) => setProgrammeFilter(e.target.value)}
          className="rounded-lg border border-slate-200 px-4 py-2 text-sm text-slate-700 outline-none focus:border-sky-500"
        >
          <option value="all">All Programmes</option>
          {programmes.map((prog) => (
            <option key={prog} value={prog}>
              {prog}
            </option>
          ))}
        </select>
      </div>

      {/* Student List */}
      {loading ? (
        <div className="py-12 text-center text-slate-500">Loading...</div>
      ) : filteredStudents.length === 0 ? (
        <div className="rounded-xl border border-slate-200 bg-white p-12 text-center shadow-sm">
          <p className="text-slate-600">No students found.</p>
        </div>
      ) : (
        <div className="space-y-4">
          {filteredStudents.map((student) => {
            const initials = student.name
              .split(' ')
              .map((n) => n[0])
              .join('')
              .toUpperCase()
              .slice(0, 2);
            return (
              <div key={student._id} className="rounded-xl border border-slate-200 bg-white p-6 shadow-sm">
                <div className="flex items-start gap-4">
                  <div className="flex h-12 w-12 items-center justify-center rounded-full bg-sky-100 text-sky-700 font-bold text-lg">
                    {initials}
                  </div>
                  <div className="flex-1">
                    <div className="mb-2 flex items-center gap-3">
                      <h3 className="text-lg font-bold text-slate-900">{student.name}</h3>
                      <span className="rounded-full bg-sky-100 px-3 py-1 text-xs font-medium text-sky-700">
                        Student
                      </span>
                    </div>
                    <div className="flex flex-wrap items-center gap-2 text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Email:</span>
                      <span>{student.email}</span>
                      <button
                        onClick={() => {
                          window.open(`https://mail.google.com/mail/?view=cm&fs=1&to=${encodeURIComponent(student.email)}`, '_blank');
                        }}
                        className="rounded-lg border border-purple-200 bg-purple-50 px-3 py-1 text-xs font-semibold text-purple-700 hover:bg-purple-100"
                      >
                        Send Email
                      </button>
                    </div>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Student ID:</span> {student.studentId}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Programme:</span> {student.programme}
                    </p>
                    <p className="text-sm text-slate-600">
                      <span className="font-medium text-slate-700">Registered:</span>{' '}
                      {student.createdAt ? new Date(student.createdAt).toLocaleDateString() : '—'}
                    </p>
                    {student.skills && student.skills.length > 0 && (
                      <div className="mt-3 flex flex-wrap gap-2">
                        {student.skills.map((skill) => (
                          <span
                            key={skill}
                            className="rounded-full bg-purple-100 px-3 py-1 text-xs font-medium text-purple-700"
                          >
                            {skill}
                          </span>
                        ))}
                      </div>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </PageShell>
  );
};

export default AdminAllStudentsPage;
