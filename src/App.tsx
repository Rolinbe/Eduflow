import { Routes, Route, Navigate } from 'react-router-dom';
import { useAuthStore } from './stores/authStore';
import { useEffect } from 'react';
import { getSocket, disconnectSocket } from './services/socket';
import { useThemeStore } from './stores/themeStore';
import type { ReactNode } from 'react';
import LoginPage from './pages/LoginPage';
import ForgotPasswordPage from './pages/ForgotPasswordPage';
import ResetPasswordPage from './pages/ResetPasswordPage';
import AdminDashboardPage from './pages/admin/AdminDashboardPage';
import CourseManagementPage from './pages/admin/CourseManagementPage';
import UserManagementPage from './pages/admin/UserManagementPage';
import AdminChatPage from './pages/admin/AdminChatPage';
import AdminProfilePage from './pages/admin/AdminProfilePage';
import AdminAnnouncementsPage from './pages/admin/AdminAnnouncementsPage';
import MentorDashboardPage from './pages/mentor/MentorDashboardPage';
import MentorCoursesPage from './pages/mentor/MentorCoursesPage';
import MentorStudentsPage from './pages/mentor/MentorStudentsPage';
import MentorChatPage from './pages/mentor/MentorChatPage';
import MentorProfilePage from './pages/mentor/MentorProfilePage';
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import CourseCatalogPage from './pages/student/CourseCatalogPage';
import MyCoursesPage from './pages/student/MyCoursesPage';
import CoursePlayerPage from './pages/student/CoursePlayerPage';
import CertificatesPage from './pages/student/CertificatesPage';
import StudentChatPage from './pages/student/StudentChatPage';
import StudentProfilePage from './pages/student/StudentProfilePage';

const roleRedirects: Record<string, string> = {
  ADMIN: '/admin',
  MENTOR: '/mentor',
  APPRENANT: '/student',
};

function ProtectedRoute({ children, roles }: { children: ReactNode; roles: string[] }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (!roles.includes(user.role)) {
    return <Navigate to={roleRedirects[user.role] || '/login'} replace />;
  }
  return <>{children}</>;
}

export default function App() {
  const { user, isAuthenticated } = useAuthStore();
  const { isDark } = useThemeStore();

  useEffect(() => {
    if (isDark) {
      document.documentElement.classList.add('dark');
    } else {
      document.documentElement.classList.remove('dark');
    }
  }, [isDark]);

  useEffect(() => {
    if (isAuthenticated) {
      const socket = getSocket();
      return () => { disconnectSocket(); };
    }
  }, [isAuthenticated]);

  return (
    <Routes>
      <Route path="/login" element={isAuthenticated ? <Navigate to={roleRedirects[user?.role || 'APPRENANT'] || '/login'} replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      {/* Admin routes */}
      <Route path="/admin" element={<ProtectedRoute roles={['ADMIN']}><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute roles={['ADMIN']}><CourseManagementPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute roles={['ADMIN']}><UserManagementPage /></ProtectedRoute>} />
      <Route path="/admin/chat" element={<ProtectedRoute roles={['ADMIN']}><AdminChatPage /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute roles={['ADMIN']}><AdminAnnouncementsPage /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute roles={['ADMIN']}><AdminProfilePage /></ProtectedRoute>} />

      {/* Mentor routes */}
      <Route path="/mentor" element={<ProtectedRoute roles={['MENTOR']}><MentorDashboardPage /></ProtectedRoute>} />
      <Route path="/mentor/courses" element={<ProtectedRoute roles={['MENTOR']}><MentorCoursesPage /></ProtectedRoute>} />
      <Route path="/mentor/students" element={<ProtectedRoute roles={['MENTOR']}><MentorStudentsPage /></ProtectedRoute>} />
      <Route path="/mentor/chat" element={<ProtectedRoute roles={['MENTOR']}><MentorChatPage /></ProtectedRoute>} />
      <Route path="/mentor/profile" element={<ProtectedRoute roles={['MENTOR']}><MentorProfilePage /></ProtectedRoute>} />

      {/* Student routes */}
      <Route path="/student" element={<ProtectedRoute roles={['APPRENANT']}><StudentDashboardPage /></ProtectedRoute>} />
      <Route path="/student/catalog" element={<ProtectedRoute roles={['APPRENANT']}><CourseCatalogPage /></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute roles={['APPRENANT']}><MyCoursesPage /></ProtectedRoute>} />
      <Route path="/student/course/:id" element={<ProtectedRoute roles={['APPRENANT']}><CoursePlayerPage /></ProtectedRoute>} />
      <Route path="/student/certificates" element={<ProtectedRoute roles={['APPRENANT']}><CertificatesPage /></ProtectedRoute>} />
      <Route path="/student/chat" element={<ProtectedRoute roles={['APPRENANT']}><StudentChatPage /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute roles={['APPRENANT']}><StudentProfilePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={isAuthenticated ? roleRedirects[user?.role || 'APPRENANT'] || '/login' : '/login'} replace />} />
    </Routes>
  );
}
