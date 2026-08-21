import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

function getHomePath(role: string) {
  if (role === 'ADMIN') return '/admin';
  if (role === 'MENTOR') return '/mentor';
  return '/student';
}

export function useAuth() {
  const { user, isAuthenticated, login, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    login(res.data.user, res.data.token, res.data.refreshToken);
    toast.success('Connexion réussie!');
    navigate(getHomePath(res.data.user.role));
  };

  const handleRegister = async (data: { firstName: string; lastName: string; email?: string; password: string; role?: string; niveau?: string; serie?: string; niveauResponsable?: string; serieResponsable?: string }) => {
    const res = await api.post('/auth/register', data);
    return res.data;
  };

  const handleLogout = async () => {
    try {
      await api.post('/auth/logout');
    } catch {
      // ignore
    }
    logout();
    toast.success('Déconnexion réussie');
    navigate('/login');
  };

  return { user, isAuthenticated, handleLogin, handleRegister, handleLogout, updateUser };
}
