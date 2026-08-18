import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import StudentLayout from '../../components/layout/StudentLayout';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Certificate } from '../../types';

export default function CertificatesPage() {
  const { data: certificatesData, isLoading } = useQuery({
    queryKey: ['my-certificates'],
    queryFn: async () => {
      const res = await api.get('/apprenant/certificates');
      return res.data;
    },
  });

  const certificates: Certificate[] = certificatesData?.certificates || [];

  return (
    <StudentLayout title="Mes certificats">
      {isLoading ? (
        <LoadingSpinner className="py-12" />
      ) : certificates.length > 0 ? (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {certificates.map((cert: Certificate) => (
            <div key={cert.id} className={`bg-white rounded-xl shadow-card overflow-hidden ${cert.status === 'REVOQUE' ? 'opacity-60' : ''}`}>
              <div className="bg-gradient-to-r from-primary-500 to-primary-700 p-6 text-center relative">
                {cert.status === 'REVOQUE' && (
                  <div className="absolute top-2 right-2 px-2 py-0.5 bg-red-500 text-white text-xs font-medium rounded">
                    Révoqué
                  </div>
                )}
                <span className="material-symbols-outlined text-5xl text-white/90">workspace_premium</span>
                <h3 className="text-white font-bold text-lg mt-2">Certificat de complétion</h3>
              </div>
              <div className="p-6">
                <p className="text-sm text-gray-500">Cours</p>
                <p className="font-semibold text-gray-900">
                  {cert.cours?.title || 'Cours'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500">
                  <span className="material-symbols-outlined text-lg">calendar_today</span>
                  {new Date(cert.issuedAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {cert.uniqueNumber && (
                  <div className="mt-3 p-3 bg-gray-50 rounded-lg">
                    <p className="text-xs text-gray-400 mb-1">Numéro unique</p>
                    <p className="text-sm font-mono text-gray-700 break-all">{cert.uniqueNumber}</p>
                  </div>
                )}
                <div className="flex gap-2 mt-4">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/verify?key=${cert.uniqueNumber}`
                      );
                      toast.success('Lien copié dans le presse-papier');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-primary-600 bg-primary-50 rounded-lg hover:bg-primary-100 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">share</span>
                    Partager
                  </button>
                  <a
                    href={`https://www.linkedin.com/shareArticle?mini=true&url=${encodeURIComponent(
                      `${window.location.origin}/verify?key=${cert.uniqueNumber}`
                    )}&title=${encodeURIComponent(`Certificat - ${cert.cours?.title || ''}`)}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="flex-1 flex items-center justify-center gap-2 px-3 py-2 text-sm font-medium text-gray-600 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                  >
                    <span className="material-symbols-outlined text-lg">work</span>
                    LinkedIn
                  </a>
                </div>
              </div>
            </div>
          ))}
        </div>
      ) : (
        <div className="text-center py-16">
          <span className="material-symbols-outlined text-6xl text-gray-300">workspace_premium</span>
          <h3 className="text-lg font-semibold text-gray-900 mt-4">Aucun certificat</h3>
          <p className="text-sm text-gray-500 mt-2">
            Terminez vos cours pour obtenir des certificats
          </p>
        </div>
      )}
    </StudentLayout>
  );
}
