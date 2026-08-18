import { useAuthStore } from '../stores/authStore';
import { useNavigate } from 'react-router-dom';
import api from '../services/api';
import toast from 'react-hot-toast';

export function useAuth() {
  const { user, isAuthenticated, login, logout, updateUser } = useAuthStore();
  const navigate = useNavigate();

  const handleLogin = async (email: string, password: string) => {
    const res = await api.post('/auth/login', { email, password });
    login(res.data.user, res.data.token, res.data.refreshToken);
    toast.success('Connexion réussie!');
    navigate(res.data.user.role === 'ADMIN' ? '/admin' : '/student');
  };

  const handleRegister = async (data: { firstName: string; lastName: string; email: string; password: string; niveau?: string; serie?: string }) => {
    const res = await api.post('/auth/register', data);
    login(res.data.user, res.data.token, res.data.refreshToken);
    toast.success('Compte créé avec succès!');
    navigate('/student');
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
