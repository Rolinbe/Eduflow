import { useState, useRef } from 'react';
import toast from 'react-hot-toast';
import api from '../../services/api';

interface PdfUploadProps {
  coursId: string;
  onSuccess: () => void;
}

export default function PdfUpload({ coursId, onSuccess }: PdfUploadProps) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [file, setFile] = useState<File | null>(null);
  const [uploading, setUploading] = useState(false);
  const [progress, setProgress] = useState(0);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const handleUpload = async () => {
    if (!file || !title.trim()) {
      toast.error('Veuillez remplir tous les champs requis');
      return;
    }
    setUploading(true);
    setProgress(0);
    const formData = new FormData();
    formData.append('pdf', file);
    formData.append('title', title);
    formData.append('description', description);

    try {
      await api.post(`/admin/cours/${coursId}/pdfs`, formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
        onUploadProgress: (e) => {
          if (e.total) setProgress(Math.round((e.loaded * 100) / e.total));
        },
      });
      toast.success('PDF uploadé avec succès');
      setTitle('');
      setDescription('');
      setFile(null);
      setProgress(0);
      onSuccess();
    } catch (err: any) {
      toast.error(err.response?.data?.message || "Erreur lors de l'upload");
    } finally {
      setUploading(false);
    }
  };

  return (
    <div className="space-y-4">
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Titre du PDF *</label>
        <input
          type="text"
          value={title}
          onChange={(e) => setTitle(e.target.value)}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent"
          placeholder="Ex: Cours PDF - Chapter 1"
        />
      </div>
      <div>
        <label className="block text-sm font-medium text-gray-700 mb-1">Description</label>
        <textarea
          value={description}
          onChange={(e) => setDescription(e.target.value)}
          rows={2}
          className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none"
          placeholder="Description optionnelle"
        />
      </div>
      <div
        onClick={() => fileInputRef.current?.click()}
        className="border-2 border-dashed border-gray-200 rounded-lg p-8 text-center cursor-pointer hover:border-primary-300 transition-colors"
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".pdf"
          onChange={(e) => setFile(e.target.files?.[0] || null)}
          className="hidden"
        />
        {file ? (
          <div>
            <span className="material-symbols-outlined text-3xl text-danger">picture_as_pdf</span>
            <p className="text-sm text-gray-600 mt-2">{file.name}</p>
            <p className="text-xs text-gray-400 mt-1">{(file.size / (1024 * 1024)).toFixed(1)} MB</p>
          </div>
        ) : (
          <div>
            <span className="material-symbols-outlined text-3xl text-gray-300">cloud_upload</span>
            <p className="text-sm text-gray-500 mt-2">Cliquez pour sélectionner un PDF</p>
            <p className="text-xs text-gray-400 mt-1">PDF uniquement (max 50MB)</p>
          </div>
        )}
      </div>
      {uploading && (
        <div>
          <div className="flex justify-between text-xs text-gray-500 mb-1">
            <span>Upload en cours...</span>
            <span>{progress}%</span>
          </div>
          <div className="w-full h-2 bg-gray-200 rounded-full">
            <div className="h-2 bg-primary-500 rounded-full transition-all" style={{ width: `${progress}%` }} />
          </div>
        </div>
      )}
      <button
        onClick={handleUpload}
        disabled={uploading || !file || !title.trim()}
        className="w-full py-2.5 bg-primary-500 text-white rounded-lg text-sm font-medium hover:bg-primary-600 transition-colors disabled:opacity-50"
      >
        {uploading ? 'Upload en cours...' : 'Uploader le PDF'}
      </button>
    </div>
  );
}
