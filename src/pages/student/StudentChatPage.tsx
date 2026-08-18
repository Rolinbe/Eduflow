import StudentLayout from '../../components/layout/StudentLayout';

export default function StudentChatPage() {
  return (
    <StudentLayout title="Messages">
      <div className="text-center py-16">
        <span className="material-symbols-outlined text-6xl text-gray-300">chat</span>
        <h3 className="text-lg font-semibold text-gray-900 mt-4">Messagerie</h3>
        <p className="text-sm text-gray-500 mt-2">
          Utilisez le bouton de chat en bas à droite pour envoyer des messages à l'enseignant
        </p>
      </div>
    </StudentLayout>
  );
}
