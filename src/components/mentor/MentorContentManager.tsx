import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import toast from 'react-hot-toast';
import type { Video, Pdf } from '../../types';

interface MentorContentManagerProps {
  coursId: number;
  onSuccess: () => void;
}

export default function MentorContentManager({ coursId, onSuccess }: MentorContentManagerProps) {
  const [tab, setTab] = useState<'videos' | 'pdfs'>('videos');
  const [showUpload, setShowUpload] = useState(false);
  const [editingItem, setEditingItem] = useState<any>(null);
  const queryClient = useQueryClient();

  const { data: courseDetail } = useQuery({
    queryKey: ['mentor-course-detail', coursId],
    queryFn: async () => {
      const res = await api.get(`/mentor/cours/${coursId}/detail`);
      return res.data.course;
    },
  });

  const deleteVideoMutation = useMutation({
    mutationFn: async (videoId: number) => api.delete(`/mentor/videos/${videoId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-course-detail', coursId] });
      queryClient.invalidateQueries({ queryKey: ['mentor-courses'] });
      onSuccess();
      toast.success('Vidéo supprimée');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const deletePdfMutation = useMutation({
    mutationFn: async (pdfId: number) => api.delete(`/mentor/pdfs/${pdfId}`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-course-detail', coursId] });
      queryClient.invalidateQueries({ queryKey: ['mentor-courses'] });
      onSuccess();
      toast.success('PDF supprimé');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const updateVideoMutation = useMutation({
    mutationFn: async ({ videoId, data }: { videoId: number; data: any }) =>
      api.put(`/mentor/videos/${videoId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-course-detail', coursId] });
      setEditingItem(null);
      toast.success('Vidéo mise à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const updatePdfMutation = useMutation({
    mutationFn: async ({ pdfId, data }: { pdfId: number; data: any }) =>
      api.put(`/mentor/pdfs/${pdfId}`, data),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-course-detail', coursId] });
      setEditingItem(null);
      toast.success('PDF mis à jour');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const uploadVideoMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      api.post(`/mentor/cours/${coursId}/videos`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-course-detail', coursId] });
      queryClient.invalidateQueries({ queryKey: ['mentor-courses'] });
      setShowUpload(false);
      onSuccess();
      toast.success('Vidéo uploadée avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erreur lors de l'upload"),
  });

  const uploadPdfMutation = useMutation({
    mutationFn: async (formData: FormData) =>
      api.post(`/mentor/cours/${coursId}/pdfs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['mentor-course-detail', coursId] });
      queryClient.invalidateQueries({ queryKey: ['mentor-courses'] });
      setShowUpload(false);
      onSuccess();
      toast.success('PDF uploadé avec succès');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || "Erreur lors de l'upload"),
  });

  const videos: Video[] = courseDetail?.videos || [];
  const pdfs: Pdf[] = courseDetail?.pdfs || [];

  return (
    <div>
      <div className="flex gap-2 mb-4 border-b border-gray-100 dark:border-dark-700 pb-2">
        <button
          onClick={() => { setTab('videos'); setShowUpload(false); setEditingItem(null); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'videos' ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'text-gray-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-700'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">videocam</span>
          Vidéos ({videos.length})
        </button>
        <button
          onClick={() => { setTab('pdfs'); setShowUpload(false); setEditingItem(null); }}
          className={`px-4 py-2 text-sm font-medium rounded-lg transition-all duration-200 ${
            tab === 'pdfs' ? 'bg-violet-50 text-violet-700 dark:bg-violet-900/30 dark:text-violet-400' : 'text-gray-500 dark:text-dark-400 hover:bg-gray-50 dark:hover:bg-dark-700'
          }`}
        >
          <span className="material-symbols-outlined text-sm align-middle mr-1">description</span>
          PDFs ({pdfs.length})
        </button>
      </div>

      {!showUpload && !editingItem && (
        <button
          onClick={() => setShowUpload(true)}
          className="mb-4 flex items-center gap-2 px-4 py-2 bg-violet-50 dark:bg-violet-900/20 text-violet-700 dark:text-violet-400 text-sm font-medium rounded-lg hover:bg-violet-100 dark:hover:bg-violet-900/30 transition-all duration-200"
        >
          <span className="material-symbols-outlined text-lg">add</span>
          Ajouter {tab === 'videos' ? 'une vidéo' : 'un PDF'}
        </button>
      )}

      {showUpload && tab === 'videos' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ajouter une vidéo</h4>
            <button onClick={() => setShowUpload(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors">Annuler</button>
          </div>
          <MentorVideoUpload
            coursId={String(coursId)}
            isPending={uploadVideoMutation.isPending}
            onUpload={(formData) => uploadVideoMutation.mutate(formData)}
          />
        </div>
      )}

      {showUpload && tab === 'pdfs' && (
        <div className="mb-4">
          <div className="flex items-center justify-between mb-3">
            <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Ajouter un PDF</h4>
            <button onClick={() => setShowUpload(false)} className="text-xs text-gray-400 hover:text-gray-600 dark:hover:text-dark-200 transition-colors">Annuler</button>
          </div>
          <MentorPdfUpload
            coursId={String(coursId)}
            isPending={uploadPdfMutation.isPending}
            onUpload={(formData) => uploadPdfMutation.mutate(formData)}
          />
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
            <p className="text-sm text-gray-400 dark:text-dark-400 text-center py-6">Aucune vidéo. Cliquez sur "Ajouter" pour commencer.</p>
          ) : (
            videos.map((video: Video) => (
              <div key={video.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200">
                <span className="material-symbols-outlined text-blue-500">videocam</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{video.title}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-400">
                    {video.duration > 0 ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}` : 'Durée inconnue'}
                    {' · '}Position {video.position}
                    {video.isRequired && ' · Obligatoire'}
                  </p>
                </div>
                <button onClick={() => setEditingItem(video)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-400 hover:text-violet-500 transition-all duration-200" title="Modifier">
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button onClick={() => deleteVideoMutation.mutate(video.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-200" title="Supprimer">
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
            <p className="text-sm text-gray-400 dark:text-dark-400 text-center py-6">Aucun PDF. Cliquez sur "Ajouter" pour commencer.</p>
          ) : (
            pdfs.map((pdf: Pdf) => (
              <div key={pdf.id} className="flex items-center gap-3 p-3 border border-gray-100 dark:border-dark-700 rounded-xl hover:bg-gray-50 dark:hover:bg-dark-700 transition-all duration-200">
                <span className="material-symbols-outlined text-red-500">picture_as_pdf</span>
                <div className="flex-1 min-w-0">
                  <p className="text-sm font-medium text-gray-900 dark:text-white truncate">{pdf.title}</p>
                  <p className="text-xs text-gray-400 dark:text-dark-400">
                    {pdf.pageCount > 0 ? `${pdf.pageCount} pages` : 'Pages inconnues'}
                    {' · '}Position {pdf.position}
                  </p>
                </div>
                <button onClick={() => setEditingItem(pdf)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-violet-50 dark:hover:bg-violet-900/20 text-gray-400 hover:text-violet-500 transition-all duration-200" title="Modifier">
                  <span className="material-symbols-outlined text-base">edit</span>
                </button>
                <button onClick={() => deletePdfMutation.mutate(pdf.id)} className="w-8 h-8 flex items-center justify-center rounded-lg hover:bg-red-50 dark:hover:bg-red-900/20 text-gray-400 hover:text-red-500 transition-all duration-200" title="Supprimer">
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

function MentorVideoUpload({ coursId, isPending, onUpload }: { coursId: string; isPending: boolean; onUpload: (fd: FormData) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [progress, setProgress] = useState(0);

  const handleUpload = () => {
    if (!file || !title.trim()) { toast.error('Veuillez remplir tous les champs requis'); return; }
    const formData = new FormData();
    formData.append('video', file);
    formData.append('title', title);
    formData.append('description', description);
    onUpload(formData);
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200";

  return (
    <div className="space-y-3">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Titre de la vidéo *" />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description (optionnel)" />
      <div className="border-2 border-dashed border-gray-200 dark:border-dark-600 rounded-xl p-6 text-center cursor-pointer hover:border-violet-300 dark:hover:border-violet-600 transition-colors" onClick={() => document.getElementById('mentor-video-input')?.click()}>
        <input id="mentor-video-input" type="file" accept="video/*" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
        {file ? (
          <div>
            <span className="material-symbols-outlined text-3xl text-violet-500">video_file</span>
            <p className="text-sm text-gray-600 dark:text-dark-300 mt-2">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        ) : (
          <div>
            <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-dark-500">cloud_upload</span>
            <p className="text-sm text-gray-500 dark:text-dark-400 mt-2">Cliquez pour sélectionner une vidéo</p>
            <p className="text-xs text-gray-400 dark:text-dark-500 mt-1">MP4, MOV, AVI (max 500MB)</p>
          </div>
        )}
      </div>
      <button onClick={handleUpload} disabled={isPending || !file || !title.trim()} className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-50">
        {isPending ? 'Upload en cours...' : 'Uploader la vidéo'}
      </button>
    </div>
  );
}

function MentorPdfUpload({ coursId, isPending, onUpload }: { coursId: string; isPending: boolean; onUpload: (fd: FormData) => void }) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);

  const handleUpload = () => {
    if (!file || !title.trim()) { toast.error('Veuillez remplir tous les champs requis'); return; }
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);
    formData.append('description', description);
    onUpload(formData);
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200";

  return (
    <div className="space-y-3">
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Titre du PDF *" />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description (optionnel)" />
      <div className="border-2 border-dashed border-gray-200 dark:border-dark-600 rounded-xl p-6 text-center cursor-pointer hover:border-violet-300 dark:hover:border-violet-600 transition-colors" onClick={() => document.getElementById('mentor-pdf-input')?.click()}>
        <input id="mentor-pdf-input" type="file" accept=".pdf" onChange={(e) => setFile(e.target.files?.[0] || null)} className="hidden" />
        {file ? (
          <div>
            <span className="material-symbols-outlined text-3xl text-red-500">picture_as_pdf</span>
            <p className="text-sm text-gray-600 dark:text-dark-300 mt-2">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        ) : (
          <div>
            <span className="material-symbols-outlined text-3xl text-gray-300 dark:text-dark-500">cloud_upload</span>
            <p className="text-sm text-gray-500 dark:text-dark-400 mt-2">Cliquez pour sélectionner un PDF</p>
            <p className="text-xs text-gray-400 dark:text-dark-500 mt-1">PDF uniquement (max 50MB)</p>
          </div>
        )}
      </div>
      <button onClick={handleUpload} disabled={isPending || !file || !title.trim()} className="w-full py-2.5 bg-gradient-to-r from-violet-500 to-violet-600 text-white rounded-xl text-sm font-semibold hover:from-violet-600 hover:to-violet-700 transition-all duration-200 shadow-lg shadow-violet-500/25 disabled:opacity-50">
        {isPending ? 'Upload en cours...' : 'Uploader le PDF'}
      </button>
    </div>
  );
}

function EditVideoForm({ video, onSave, onCancel, isLoading }: { video: Video; onSave: (data: any) => void; onCancel: () => void; isLoading: boolean }) {
  const [title, setTitle] = useState(video.title);
  const [description, setDescription] = useState(video.description || '');
  const [duration, setDuration] = useState(video.duration);
  const [isRequired, setIsRequired] = useState(video.isRequired);

  const inputClass = "w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200";

  return (
    <div className="space-y-3 border-2 border-violet-200 dark:border-violet-800 rounded-xl p-4 bg-violet-50/30 dark:bg-violet-900/10">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Modifier la vidéo</h4>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Titre" />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description" />
      <div className="flex gap-3">
        <div className="flex-1">
          <label className="text-xs text-gray-500 dark:text-dark-400">Durée (secondes)</label>
          <input type="number" value={duration} onChange={(e) => setDuration(Number(e.target.value))} className={inputClass} />
        </div>
        <div className="flex items-end">
          <label className="flex items-center gap-2 text-sm text-gray-600 dark:text-dark-300">
            <input type="checkbox" checked={isRequired} onChange={(e) => setIsRequired(e.target.checked)} className="rounded bg-white dark:bg-dark-800 border-gray-300 dark:border-dark-600" />
            Obligatoire
          </label>
        </div>
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
        <button onClick={() => onSave({ title, description: description || null, duration, isRequired })} disabled={isLoading || !title.trim()} className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-violet-500/25">
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

  const inputClass = "w-full px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-xl text-sm bg-gray-50 dark:bg-dark-900 dark:text-white focus:outline-none focus:ring-2 focus:ring-violet-500 transition-all duration-200";

  return (
    <div className="space-y-3 border-2 border-violet-200 dark:border-violet-800 rounded-xl p-4 bg-violet-50/30 dark:bg-violet-900/10">
      <h4 className="text-sm font-semibold text-gray-900 dark:text-white">Modifier le PDF</h4>
      <input type="text" value={title} onChange={(e) => setTitle(e.target.value)} className={inputClass} placeholder="Titre" />
      <input type="text" value={description} onChange={(e) => setDescription(e.target.value)} className={inputClass} placeholder="Description" />
      <div>
        <label className="text-xs text-gray-500 dark:text-dark-400">Nombre de pages</label>
        <input type="number" value={pageCount} onChange={(e) => setPageCount(Number(e.target.value))} className={inputClass} />
      </div>
      <div className="flex justify-end gap-2">
        <button onClick={onCancel} className="px-3 py-1.5 text-sm text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-xl hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200">Annuler</button>
        <button onClick={() => onSave({ title, description: description || null, pageCount })} disabled={isLoading || !title.trim()} className="px-3 py-1.5 text-sm text-white bg-gradient-to-r from-violet-500 to-violet-600 rounded-xl hover:from-violet-600 hover:to-violet-700 disabled:opacity-50 transition-all duration-200 shadow-lg shadow-violet-500/25">
          {isLoading ? 'Enregistrement...' : 'Enregistrer'}
        </button>
      </div>
    </div>
  );
}
