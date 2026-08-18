import StudentLayout from '../../components/layout/StudentLayout';
import ProfilePage from '../../components/profile/ProfilePage';

export default function StudentProfilePage() {
  return (
    <StudentLayout title="Mon profil">
      <ProfilePage />
    </StudentLayout>
  );
}
