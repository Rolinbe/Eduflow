import AdminLayout from '../../components/layout/AdminLayout';
import ChatPanel from '../../components/admin/ChatPanel';

export default function AdminChatPage() {
  return (
    <AdminLayout title="Messagerie">
      <ChatPanel />
    </AdminLayout>
  );
}
