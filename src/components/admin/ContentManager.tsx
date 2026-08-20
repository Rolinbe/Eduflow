import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import VideoUpload from './VideoUpload';
import PdfUpload from './PdfUpload';
import toast from 'react-hot-toast';
import type { Video, Pdf } from '../../types';

interface ContentManagerProps {
  coursId: number;
  onSuccess: () => void;
}

export default function ContentManager({ coursId, onSuccess }: ContentManagerProps) {
  const [tab, setTab] = useState<'videos' | 'pdfs'>('videos');
  const [showUpload, setShowUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: courseContent } = useQuery({
    queryKey: ['admin-cours-detail', coursId],
    queryFn: async () => {
      const res = await api.get(`/admin/cours?page=1&limit=100`);
      const course = res.data.courses.find((c: any) => c.id === coursId);
      return course;
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => api.delete(`/admin/videos/${videoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours-detail', coursId] });
      onSuccess();
      toast.success('Vidéo supprimée');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deletePdfMutation = useMutation({
    mutationFn: async (pdfId: number) => api.delete(`/admin/pdfs/${pdfId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours-detail', coursId] });
      onSuccess();
      toast.success('PDF supprimé');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ videoId, data }: { videoId: number; data: any }) =>
      api.put(`/admin/videos/${videoId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours-detail', coursId] });
      setEditingItem(null);
      toast.success('Vidéo mise à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const updatePdfMutation = useMutation({
    mutationFn: async ({ pdfId, data }: { pdfId: number; data: any }) =>
      api.put(`/admin/pdfs/${pdfId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['admin-cours-detail', coursId] });
      setEditingItem(null);
      toast.success('PDF mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const videos = courseContent?.videos || [];
  const pdfs = courseContent?.pdfs || [];

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-gray-100 dark:border-dark-700 pb-2 transition-colors duration-200">
        <button
          onClick={() => { setTab('videos'); setShowUpload(false); setEditingItem(null); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'videos' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-700'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">videocam</span>
          Vidéos ({videos.length})
        </button>
        <button
          onClick={() => { setTab('pdfs'); setShowUpload(false); setEditingItem(null); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'pdfs' ? 'bg-primary-50 text-primary-700' : 'text-gray-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-700'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">description</span>
          PDFs ({pdfs.length})
        </button>
      </div>

      {!showUpload && !editingItem && (
        <button
          onClick={() => setShowUpload(true)}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-primary-50 text-primary-700 text-sm font-medium rounded-lg hover:bg-primary-100 transition-all duration-200 hover:shadow-md"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Ajouter {tab === 'videos' ? 'une vidéo' : 'un PDF'}
        </button>
      )}

      {showUpload && tab === 'videos' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Ajouter une vidéo</h4>
            <button onClick={() => setShowUpload(false)} className="text-xs text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200">Annuler</button>
          </div>
          <VideoUpload coursId={String(coursId)} onSuccess={() => { setShowUpload(false); onSuccess(); queryClient.invalidateQueries({ queryKey: ['admin-cours-detail', coursId] }); }} />
        </div>
      )}

      {showUpload && tab === 'pdfs' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Ajouter un PDF</h4>
            <button onClick={() => setShowUpload(false)} className="text-xs text-gray-400 dark:text-dark-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors duration-200">Annuler</button>
          </div>
          <PdfUpload coursId={String(coursId)} onSuccess={() => { setShowUpload(false); onSuccess(); queryClient.invalidateQueries({ queryKey: ['admin-cours-detail', coursId] }); }} />
        </div>
      )}

      {editingItem && tab === 'videos' && (
        <EditVideoForm
          video={editingItem}
          onSave={(data) => updateVideoMutation.mutate({ videoId: editingItem.id, data })}
          onCancel={() => setEditingItem(null)}
          isLoading={updateVideoMutation.isPending}
        />
      )}

      {editingItem && tab === 'pdfs' && (
        <EditPdfForm
          pdf={editingItem}
          onSave={(data) => updatePdfMutation.mutate({ pdfId: editingItem.id, data })}
          onCancel={() => setEditingItem(null)}
          isLoading={updatePdfMutation.isPending}
        />
      )}

      {tab === 'videos' && !showUpload && !editingItem && (
        <div className="space-y-2">
          {videos.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-dark-400 text-center py-6 transition-colors duration-200">Aucune vidéo. Cliquez sur "Ajouter" pour commencer.</p>
          ) : (
            videos.map((video: Video) => (
              <div key={video.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200">
                <span className="material-symbols-outlined text-gray-400 dark:text-dark-400 transition-colors duration-200">videocam</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate transition-colors duration-200">{video.title}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-400 transition-colors duration-200">
                    {video.duration > 0 ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : 'Durée inconnue'}
                    {' · '}Position {video.position}
                    {video.isRequired && ' · Obligatoire'}
                  </p>
                </div>
                <button onClick={() => setEditingItem(video)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 dark:text-dark-400 hover:text-primary-500 transition-all duration-200" title="Modifier">
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button onClick={() => deleteVideoMutation.mutate(video.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-dark-400 hover:text-danger transition-all duration-200" title="Supprimer">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}

      {tab === 'pdfs' && !showUpload && !editingItem && (
        <div className="space-y-2">
          {pdfs.length === 0 ? (
            <p className="text-sm text-gray-400 dark:text-dark-400 text-center py-6 transition-colors duration-200">Aucun PDF. Cliquez sur "Ajouter" pour commencer.</p>
          ) : (
            pdfs.map((pdf: Pdf) => (
              <div key={pdf.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-dark-700 rounded-lg hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200">
                <span className="material-symbols-outlined text-danger">picture_as_pdf</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate transition-colors duration-200">{pdf.title}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-400 transition-colors duration-200">
                    {pdf.pageCount > 0 ? `${pdf.pageCount} pages` : 'Pages inconnues'}
                    {' · '}Position {pdf.position}
                  </p>
                </div>
                <button onClick={() => setEditingItem(pdf)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-gray-100 dark:hover:bg-dark-600 text-gray-400 dark:text-dark-400 hover:text-primary-500 transition-all duration-200" title="Modifier">
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button onClick={() => deletePdfMutation.mutate(pdf.id)} className="w-7 h-7 flex items-center justify-center rounded hover:bg-red-50 dark:hover:bg-red-900/30 text-gray-400 dark:text-dark-400 hover:text-danger transition-all duration-200" title="Supprimer">
                  <span className="material-symbols-outlined text-base">delete</span>
                </button>
              </div>
            ))
          )}
        </div>
      )}
    </div>
  );
}

function EditVideoForm({ video, onSave, onCancel, isLoading }: { video: Video; onSave: (data: any) => void; onCancel: () => void; isLoading: boolean }) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || '');
  const [duration, setDuration] = useState(video.duration);
  const [isRequired, setIsRequired] = useState(video.isRequired);

  const inputClass = "w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200";

  return (
    <div className="space-y-3 border border-primary-200 rounded-lg p-4 bg-primary-50/30 dark:bg-primary-900/20 dark:border-primary-800 transition-colors duration-200">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Modifier la vidéo</h4>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Titre" />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description" />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 dark:text-dark-400 transition-colors duration-200">Durée (secondes)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-300 transition-colors duration-200">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="rounded bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600" />
            Obligatoire
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
        <button onClick={() => onSave({ title, description: description || null, duration, isRequired })} disabled={isLoading || !title.trim()} className="px-3 py-1.5 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all duration-200 hover:shadow-md active:scale-[0.98]">
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}

function EditPdfForm({ pdf, onSave, onCancel, isLoading }: { pdf: Pdf; onSave: (data: any) => void; onCancel: () => void; isLoading: boolean }) {
  const [title, setTitle] = useState(pdf.title);
  const [description, setDescription] = useState(pdf.description || '');
  const [pageCount, setPageCount] = useState(pdf.pageCount);

  const inputClass = "w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200";

  return (
    <div className="space-y-3 border border-primary-200 rounded-lg p-4 bg-primary-50/30 dark:bg-primary-900/20 dark:border-primary-800 transition-colors duration-200">
      <h4 className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">Modifier le PDF</h4>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Titre" />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description" />
      <div>
        <label className="text-xs text-gray-500 dark:text-dark-400 transition-colors duration-200">Nombre de pages</label>
        <input type="number" value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} className={inputClass} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
        <button onClick={() => onSave({ title, description: description || null, pageCount })} disabled={isLoading || !title.trim()} className="px-3 py-1.5 text-sm text-white bg-primary-500 rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all duration-200 hover:shadow-md active:scale-[0.98]">
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
