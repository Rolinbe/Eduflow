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
import StudentDashboardPage from './pages/student/StudentDashboardPage';
import CourseCatalogPage from './pages/student/CourseCatalogPage';
import MyCoursesPage from './pages/student/MyCoursesPage';
import CoursePlayerPage from './pages/student/CoursePlayerPage';
import CertificatesPage from './pages/student/CertificatesPage';
import StudentChatPage from './pages/student/StudentChatPage';
import StudentProfilePage from './pages/student/StudentProfilePage';

function ProtectedRoute({ children, role }: { children: ReactNode; role: string }) {
  const { user, isAuthenticated } = useAuthStore();
  if (!isAuthenticated || !user) {
    return <Navigate to="/login" replace />;
  }
  if (user.role !== role) {
    return <Navigate to={user.role === 'ADMIN' ? '/admin' : '/student'} replace />;
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
      <Route path="/login" element={isAuthenticated ? <Navigate to={user?.role === 'ADMIN' ? '/admin' : '/student'} replace /> : <LoginPage />} />
      <Route path="/forgot-password" element={<ForgotPasswordPage />} />
      <Route path="/reset-password" element={<ResetPasswordPage />} />

      <Route path="/admin" element={<ProtectedRoute role="ADMIN"><AdminDashboardPage /></ProtectedRoute>} />
      <Route path="/admin/courses" element={<ProtectedRoute role="ADMIN"><CourseManagementPage /></ProtectedRoute>} />
      <Route path="/admin/users" element={<ProtectedRoute role="ADMIN"><UserManagementPage /></ProtectedRoute>} />
      <Route path="/admin/chat" element={<ProtectedRoute role="ADMIN"><AdminChatPage /></ProtectedRoute>} />
      <Route path="/admin/announcements" element={<ProtectedRoute role="ADMIN"><AdminAnnouncementsPage /></ProtectedRoute>} />
      <Route path="/admin/profile" element={<ProtectedRoute role="ADMIN"><AdminProfilePage /></ProtectedRoute>} />

      <Route path="/student" element={<ProtectedRoute role="APPRENANT"><StudentDashboardPage /></ProtectedRoute>} />
      <Route path="/student/catalog" element={<ProtectedRoute role="APPRENANT"><CourseCatalogPage /></ProtectedRoute>} />
      <Route path="/student/courses" element={<ProtectedRoute role="APPRENANT"><MyCoursesPage /></ProtectedRoute>} />
      <Route path="/student/course/:id" element={<ProtectedRoute role="APPRENANT"><CoursePlayerPage /></ProtectedRoute>} />
      <Route path="/student/certificates" element={<ProtectedRoute role="APPRENANT"><CertificatesPage /></ProtectedRoute>} />
      <Route path="/student/chat" element={<ProtectedRoute role="APPRENANT"><StudentChatPage /></ProtectedRoute>} />
      <Route path="/student/profile" element={<ProtectedRoute role="APPRENANT"><StudentProfilePage /></ProtectedRoute>} />

      <Route path="*" element={<Navigate to={isAuthenticated ? (user?.role === 'ADMIN' ? '/admin' : '/student') : '/login'} replace />} />
    </Routes>
  );
}
