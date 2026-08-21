import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import type { Commentaire } from '../../types';
import toast from 'react-hot-toast';

interface CourseContentProps {
  coursId: string;
  currentVideoId?: string;
  onVideoSelect?: (videoId: string) => void;
}

export default function CourseContent({ coursId, currentVideoId, onVideoSelect }: CourseContentProps) {
  const [expandedModules, setExpandedModules] = useState<Set<number>>(new Set([0]));

  const { data: cours, isLoading } = useQuery({
    queryKey: ['cours-detail', coursId],
    queryFn: async () => {
      const res = await api.get(`/apprenant/cours/${coursId}`);
      return res.data;
    },
  });

  if (isLoading) return <LoadingSpinner className="py-8" />;
  if (!cours) return null;

  const videos = cours.videos || [];
  const pdfs = cours.pdfs || [];

  const toggleModule = (index: number) => {
    setExpandedModules((prev) => {
      const next = new Set(prev);
      if (next.has(index)) next.delete(index);
      else next.add(index);
      return next;
    });
  };

  return (
    <div className="bg-white rounded-lg shadow-card overflow-hidden">
      <div className="p-4 border-b border-gray-100">
        <h3 className="font-semibold text-gray-900">Contenu du cours</h3>
        <p className="text-xs text-gray-400 mt-1">
          {videos.length} vidéos · {pdfs.length} PDFs
        </p>
      </div>
      <div className="divide-y divide-gray-50 max-h-96 overflow-y-auto">
        {videos.map((video: any, index: number) => (
          <div key={video.id}>
            <button
              onClick={() => onVideoSelect?.(String(video.id))}
              className={`w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-gray-50 transition-colors ${
                currentVideoId === String(video.id) ? 'bg-primary-50 border-l-2 border-primary-500' : ''
              }`}
            >
              <div className={`w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium ${
                currentVideoId === String(video.id)
                  ? 'bg-primary-500 text-white'
                  : 'bg-gray-100 text-gray-500'
              }`}>
                {currentVideoId === String(video.id) ? (
                  <span className="material-symbols-outlined text-sm">play_arrow</span>
                ) : (
                  index + 1
                )}
              </div>
              <div className="flex-1 min-w-0">
                <p className={`text-sm font-medium truncate ${
                  currentVideoId === String(video.id) ? 'text-primary-700' : 'text-gray-700'
                }`}>
                  {video.title}
                </p>
                <p className="text-xs text-gray-400">
                  {video.duration ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : ''}
                </p>
              </div>
            </button>
          </div>
        ))}
        {pdfs.length > 0 && (
          <div className="px-4 py-3">
            <p className="text-xs font-semibold text-gray-400 uppercase tracking-wider mb-2">Documents</p>
            {pdfs.map((pdf: any) => (
              <a
                key={pdf.id}
                href={pdf.url}
                target="_blank"
                rel="noopener noreferrer"
                className="flex items-center gap-3 py-2 text-sm text-gray-600 hover:text-primary-600 transition-colors"
                onClick={(e) => e.preventDefault()}
              >
                <span className="material-symbols-outlined text-lg text-red-400">picture_as_pdf</span>
                <span className="truncate">{pdf.title}</span>
                <span className="material-symbols-outlined text-sm text-gray-400 ml-auto">visibility</span>
              </a>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
