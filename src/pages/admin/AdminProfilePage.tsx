import AdminLayout from '../../components/layout/AdminLayout';
import ProfilePage from '../../components/profile/ProfilePage';

export default function AdminProfilePage() {
  return (
    <AdminLayout title="Mon profil">
      <ProfilePage />
    </AdminLayout>
  );
}
