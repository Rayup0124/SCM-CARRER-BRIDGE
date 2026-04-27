import { Routes, Route } from 'react-router-dom';
import { AuthProvider } from '../context/AuthContext';
import ProtectedRoute from '../components/ProtectedRoute';
import LandingPage from '../pages/LandingPage';
import StudentLoginPage from '../pages/student/StudentLoginPage';
import StudentInternshipsPage from '../pages/student/StudentInternshipsPage';
import StudentInternshipDetailPage from '../pages/student/StudentInternshipDetailPage';
import ApplyInternshipPage from '../pages/student/ApplyInternshipPage';
import StudentApplicationsPage from '../pages/student/StudentApplicationsPage';
import StudentFavoritesPage from '../pages/student/StudentFavoritesPage';
import StudentDashboardPage from '../pages/student/StudentDashboardPage';
import StudentAnnouncementsPage from '../pages/student/StudentAnnouncementsPage';
import StudentProfilePage from '../pages/student/StudentProfilePage';
import StudentSkillsAnalyticsPage from '../pages/student/StudentSkillsAnalyticsPage';
import CompanyLoginPage from '../pages/company/CompanyLoginPage';
import CompanyDashboardPage from '../pages/company/CompanyDashboardPage';
import CompanyPostInternshipPage from '../pages/company/CompanyPostInternshipPage';
import CompanyEditInternshipPage from '../pages/company/CompanyEditInternshipPage';
import CompanyApplicantsPage from '../pages/company/CompanyApplicantsPage';
import CompanyProfilePage from '../pages/company/CompanyProfilePage';
import AdminLoginPage from '../pages/admin/AdminLoginPage';
import AdminDashboardPage from '../pages/admin/AdminDashboardPage';
import AdminCompanyApprovalsPage from '../pages/admin/AdminCompanyApprovalsPage';
import AdminAnnouncementsPage from '../pages/admin/AdminAnnouncementsPage';
import AdminAllCompaniesPage from '../pages/admin/AdminAllCompaniesPage';
import AdminAllStudentsPage from '../pages/admin/AdminAllStudentsPage';
import AdminInternshipsPage from '../pages/admin/AdminInternshipsPage';
import AdminApplicationsPage from '../pages/admin/AdminApplicationsPage';
import ApiTestPage from '../ApiTestPage';

const AppRouter = () => (
  <AuthProvider>
    <Routes>
      {/* Public Routes */}
      <Route path="/" element={<LandingPage />} />
      <Route path="/student/login" element={<StudentLoginPage />} />
      <Route path="/company/login" element={<CompanyLoginPage />} />
      <Route path="/admin/login" element={<AdminLoginPage />} />
      <Route path="/api-test" element={<ApiTestPage />} />

      {/* Student Protected Routes */}
      <Route
        path="/student/internships/:id/apply"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <ApplyInternshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/internships/:id"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentInternshipDetailPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/internships"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentInternshipsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/applications"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentApplicationsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/dashboard"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/favorites"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentFavoritesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/profile"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentProfilePage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/announcements"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentAnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/student/skills-analytics"
        element={
          <ProtectedRoute allowedRoles={['student']}>
            <StudentSkillsAnalyticsPage />
          </ProtectedRoute>
        }
      />

      {/* Company Protected Routes */}
      <Route
        path="/company/dashboard"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <CompanyDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/internships/new"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <CompanyPostInternshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/internships/:id/edit"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <CompanyEditInternshipPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/applicants"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <CompanyApplicantsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/company/profile"
        element={
          <ProtectedRoute allowedRoles={['company']}>
            <CompanyProfilePage />
          </ProtectedRoute>
        }
      />

      {/* Admin Protected Routes */}
      <Route
        path="/admin/overview"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminDashboardPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/approvals"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminCompanyApprovalsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/companies"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAllCompaniesPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/students"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAllStudentsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/announcements"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminAnnouncementsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/internships"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminInternshipsPage />
          </ProtectedRoute>
        }
      />
      <Route
        path="/admin/applications"
        element={
          <ProtectedRoute allowedRoles={['admin']}>
            <AdminApplicationsPage />
          </ProtectedRoute>
        }
      />
    </Routes>
  </AuthProvider>
);

export default AppRouter;
