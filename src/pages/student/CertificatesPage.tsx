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
            <div key={cert.id} className={`bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark overflow-hidden transition-all duration-300 hover:shadow-xl hover:-translate-y-1 ring-1 ring-gray-100 dark:ring-dark-700 ${cert.status === 'REVOQUE' ? 'opacity-60 grayscale' : ''}`}>
              <div className="bg-gradient-to-br from-amber-400 via-amber-500 to-orange-500 p-8 text-center relative overflow-hidden">
                <div className="absolute -top-8 -right-8 w-32 h-32 bg-white/10 rounded-full blur-xl" />
                <div className="absolute -bottom-6 -left-6 w-24 h-24 bg-white/10 rounded-full blur-xl" />
                <div className="relative">
                  {cert.status === 'REVOQUE' && (
                    <div className="absolute top-0 right-0 px-3 py-1 bg-red-500 text-white text-xs font-bold rounded-xl shadow-lg shadow-red-500/30">
                      Révoqué
                    </div>
                  )}
                  <div className="w-16 h-16 bg-white/20 backdrop-blur-sm rounded-2xl flex items-center justify-center mx-auto shadow-lg">
                    <span className="material-symbols-outlined text-4xl text-white">workspace_premium</span>
                  </div>
                  <h3 className="text-white font-extrabold text-lg mt-4">Certificat de complétion</h3>
                </div>
              </div>
              <div className="p-6">
                <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-400 mb-1">Cours</p>
                <p className="font-bold text-gray-900 dark:text-white text-lg">
                  {cert.cours?.title || 'Cours'}
                </p>
                <div className="flex items-center gap-2 mt-3 text-sm text-gray-500 dark:text-dark-400">
                  <span className="material-symbols-outlined text-lg text-indigo-500">calendar_today</span>
                  {new Date(cert.issuedAt).toLocaleDateString('fr-FR', {
                    year: 'numeric',
                    month: 'long',
                    day: 'numeric',
                  })}
                </div>
                {cert.uniqueNumber && (
                  <div className="mt-4 p-3 bg-gray-50 dark:bg-dark-700 rounded-xl transition-all duration-200">
                    <p className="text-xs font-bold uppercase tracking-wider text-gray-400 dark:text-dark-400 mb-1">Numéro unique</p>
                    <p className="text-sm font-mono text-gray-700 dark:text-dark-200 break-all">{cert.uniqueNumber}</p>
                  </div>
                )}
                <div className="flex gap-3 mt-5">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(
                        `${window.location.origin}/verify?key=${cert.uniqueNumber}`
                      );
                      toast.success('Lien copié dans le presse-papier');
                    }}
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-primary-600 dark:text-primary-400 bg-gradient-to-r from-primary-50 to-indigo-50 dark:from-primary-900/30 dark:to-indigo-900/20 rounded-xl hover:from-primary-100 hover:to-indigo-100 dark:hover:from-primary-900/40 dark:hover:to-indigo-900/30 transition-all duration-200"
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
                    className="flex-1 flex items-center justify-center gap-2 px-4 py-2.5 text-sm font-semibold text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200"
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
        <div className="text-center py-16 bg-white dark:bg-dark-800 rounded-2xl border-2 border-dashed border-gray-200 dark:border-dark-600">
          <div className="w-20 h-20 bg-amber-100 dark:bg-amber-900/30 rounded-2xl flex items-center justify-center mx-auto shadow-lg shadow-amber-500/10">
            <span className="material-symbols-outlined text-4xl text-amber-500">workspace_premium</span>
          </div>
          <h3 className="text-lg font-bold text-gray-900 dark:text-white mt-5">Aucun certificat</h3>
          <p className="text-sm text-gray-500 dark:text-dark-400 mt-2">
            Terminez vos cours pour obtenir des certificats
          </p>
        </div>
      )}
    </StudentLayout>
  );
}
