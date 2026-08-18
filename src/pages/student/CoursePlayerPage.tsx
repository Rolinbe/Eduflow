import { useState, useRef, useEffect, useCallback } from 'react';
import { useParams, Link } from 'react-router-dom';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import ProgressBar from '../../components/ui/ProgressBar';
import CommentSection from '../../components/student/CommentSection';
import LoadingSpinner from '../../components/ui/LoadingSpinner';
import toast from 'react-hot-toast';
import type { Video, Pdf } from '../../types';

interface CourseDetail {
  id: number;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  status: string;
  category?: { id: number; name: string; slug: string };
  admin?: { id: number; firstName: string; lastName: string };
  videos: Video[];
  pdfs: Pdf[];
  _count?: { enrollments: number; commentaires: number };
}

interface EnrollmentData {
  id: number;
  courseId: number;
  progress: number;
}

export default function CoursePlayerPage() {
  const { id } = useParams<{ id: string }>();
  const [currentVideo, setCurrentVideo] = useState<Video | null>(null);
  const [activeTab, setActiveTab] = useState<'overview' | 'qa' | 'downloads'>('overview');
  const [sidebarOpen, setSidebarOpen] = useState(false);
  const videoRef = useRef<HTMLVideoElement>(null);
  const queryClient = useQueryClient();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressRef = useRef(0);

  const { data: courseData, isLoading: loadingCourse } = useQuery({
    queryKey: ['cours-player', id],
    queryFn: async () => {
      const res = await api.get(`/apprenant/cours/${id}`);
      return res.data as { course: CourseDetail; enrollment: EnrollmentData | null };
    },
    enabled: !!id,
  });

  const cours = courseData?.course;
  const enrollment = courseData?.enrollment;

  const { data: progressionData } = useQuery({
    queryKey: ['cours-progression', id],
    queryFn: async () => {
      const res = await api.get(`/apprenant/cours/${id}/progression`);
      return res.data;
    },
    enabled: !!id,
  });

  const updateVideoProgress = useMutation({
    mutationFn: async (data: { lessonId: number; currentTime: number; duration: number; timeSpent: number }) =>
      api.put(`/apprenant/lessons/${data.lessonId}/video-progress`, {
        currentTime: data.currentTime,
        duration: data.duration,
        timeSpent: data.timeSpent,
      }),
    onSuccess: (res) => {
      queryClient.invalidateQueries({ queryKey: ['cours-progression', id] });
      queryClient.invalidateQueries({ queryKey: ['cours-player', id] });
      if (res.data.status === 'TERMINE') {
        toast.success('Vidéo terminée !');
      }
    },
  });

  const updatePdfProgress = useMutation({
    mutationFn: async (lessonId: number) =>
      api.put(`/apprenant/lessons/${lessonId}/pdf-progress`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['cours-progression', id] });
      queryClient.invalidateQueries({ queryKey: ['cours-player', id] });
      toast.success('Document marqué comme consulté');
    },
  });

  const videos = cours?.videos || [];
  const pdfs = cours?.pdfs || [];
  const activeVideo = currentVideo || videos[0];

  useEffect(() => {
    if (videos.length > 0 && !currentVideo) {
      setCurrentVideo(videos[0]);
    }
  }, [videos]);

  const trackProgress = useCallback(() => {
    const video = videoRef.current;
    if (!video || !activeVideo) return;

    const currentTime = Math.floor(video.currentTime);
    const duration = Math.floor(video.duration);

    if (duration > 0 && currentTime > lastProgressRef.current + 10) {
      lastProgressRef.current = currentTime;
      updateVideoProgress.mutate({
        lessonId: activeVideo.id,
        currentTime,
        duration,
        timeSpent: 10,
      });
    }
  }, [activeVideo, updateVideoProgress]);

  useEffect(() => {
    const video = videoRef.current;
    if (!video) return;

    const handleTimeUpdate = () => trackProgress();
    const handleEnded = () => {
      if (activeVideo) {
        updateVideoProgress.mutate({
          lessonId: activeVideo.id,
          currentTime: Math.floor(video.duration),
          duration: Math.floor(video.duration),
          timeSpent: 0,
        });
      }
      const currentIndex = videos.findIndex((v) => v.id === activeVideo?.id);
      if (currentIndex < videos.length - 1) {
        setCurrentVideo(videos[currentIndex + 1]);
      }
    };

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('ended', handleEnded);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('ended', handleEnded);
    };
  }, [activeVideo, videos, trackProgress, updateVideoProgress]);

  useEffect(() => {
    lastProgressRef.current = 0;
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  }, [activeVideo?.id]);

  if (loadingCourse) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <LoadingSpinner size="lg" />
    </div>
  );

  if (!cours) return (
    <div className="min-h-screen bg-gray-950 flex items-center justify-center">
      <p className="text-gray-400">Cours non trouvé</p>
    </div>
  );

  return (
    <div className="min-h-screen bg-gray-950">
      <div className="flex flex-col lg:flex-row h-screen">
        <div className="flex-1 flex flex-col overflow-y-auto">
          <div className="bg-gray-900 px-4 py-3 flex items-center gap-4 flex-shrink-0">
            <Link to="/student/courses" className="text-gray-400 hover:text-white transition-colors">
              <span className="material-symbols-outlined">arrow_back</span>
            </Link>
            <div className="flex-1 min-w-0">
              <h1 className="text-white text-sm font-medium truncate">{cours.title}</h1>
              <p className="text-gray-400 text-xs">{cours.category?.name}</p>
            </div>
          </div>

          <div className="bg-black aspect-video max-h-[60vh] relative flex-shrink-0">
            {activeVideo ? (
              <video
                ref={videoRef}
                key={activeVideo.id}
                src={`/uploads/${activeVideo.url}`}
                controls
                autoPlay
                className="w-full h-full object-contain"
                poster={activeVideo.thumbnailUrl || undefined}
              >
                Votre navigateur ne supporte pas la lecture vidéo.
              </video>
            ) : (
              <div className="w-full h-full flex items-center justify-center">
                <p className="text-white/50">Aucune vidéo disponible</p>
              </div>
            )}
          </div>

          {activeVideo && (
            <div className="bg-white px-4 lg:px-6 py-4 flex-shrink-0">
              <h2 className="text-lg font-bold text-gray-900">{activeVideo.title}</h2>
              {activeVideo.description && (
                <p className="text-sm text-gray-500 mt-1">{activeVideo.description}</p>
              )}
            </div>
          )}

          <div className="bg-white border-t border-gray-100 flex-shrink-0">
            <div className="flex border-b border-gray-100 px-4 lg:px-6">
              {[
                { key: 'overview', label: 'Aperçu', icon: 'info' },
                { key: 'qa', label: 'Q&A', icon: 'question_answer' },
                { key: 'downloads', label: 'Documents', icon: 'download' },
              ].map((tab) => (
                <button
                  key={tab.key}
                  onClick={() => setActiveTab(tab.key as any)}
                  className={`flex items-center gap-2 px-4 py-3 text-sm font-medium transition-colors ${
                    activeTab === tab.key
                      ? 'text-primary-600 border-b-2 border-primary-500'
                      : 'text-gray-500 hover:text-gray-700'
                  }`}
                >
                  <span className="material-symbols-outlined text-lg">{tab.icon}</span>
                  {tab.label}
                </button>
              ))}
            </div>
            <div className="p-4 lg:p-6 max-h-64 overflow-y-auto">
              {activeTab === 'overview' && (
                <div>
                  <h3 className="text-base font-semibold text-gray-900 mb-2">Description</h3>
                  <p className="text-sm text-gray-600">{cours.description || 'Aucune description disponible.'}</p>
                  {enrollment && (
                    <div className="mt-4">
                      <h4 className="text-sm font-semibold text-gray-900 mb-2">Votre progression</h4>
                      <ProgressBar value={enrollment.progress} />
                      <p className="text-xs text-gray-400 mt-1">{enrollment.progress}% terminé</p>
                    </div>
                  )}
                </div>
              )}
              {activeTab === 'qa' && <CommentSection coursId={id || ''} />}
              {activeTab === 'downloads' && (
                <div className="space-y-3">
                  {pdfs.map((pdf) => (
                    <div key={pdf.id} className="flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors">
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl text-red-500">picture_as_pdf</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pdf.title}</p>
                          {pdf.description && <p className="text-xs text-gray-400">{pdf.description}</p>}
                        </div>
                      </div>
                      <a
                        href={`/uploads/${pdf.url}`}
                        target="_blank"
                        rel="noopener noreferrer"
                        className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg hover:bg-gray-200 transition-colors"
                      >
                        <span className="material-symbols-outlined text-sm">download</span>
                        Télécharger
                      </a>
                    </div>
                  ))}
                  {pdfs.length === 0 && (
                    <p className="text-sm text-gray-400 text-center py-4">Aucun document disponible</p>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>

        <div className="w-full lg:w-80 xl:w-96 bg-gray-900 border-l border-gray-800 flex-shrink-0 flex flex-col max-h-[calc(100vh-4rem)] lg:max-h-screen overflow-hidden">
          <div className="p-4 border-b border-gray-800 flex-shrink-0">
            <h3 className="font-semibold text-white text-sm line-clamp-1">{cours.title}</h3>
            <p className="text-xs text-gray-400 mt-1">{videos.length} vidéos · {pdfs.length} documents</p>
            {enrollment && (
              <div className="mt-3">
                <div className="flex items-center justify-between text-xs mb-1">
                  <span className="text-gray-400">Progression</span>
                  <span className="text-white font-medium">{enrollment.progress}%</span>
                </div>
                <div className="w-full h-1.5 bg-gray-700 rounded-full">
                  <div className="h-1.5 bg-primary-500 rounded-full transition-all" style={{ width: `${enrollment.progress}%` }} />
                </div>
              </div>
            )}
          </div>

          <div className="flex-1 overflow-y-auto">
            {videos.length > 0 && (
              <div className="p-2">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-2">Chapitres</p>
                <div className="space-y-0.5">
                  {videos.map((video, index) => (
                    <button
                      key={video.id}
                      onClick={() => setCurrentVideo(video)}
                      className={`w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-left transition-colors ${
                        activeVideo?.id === video.id
                          ? 'bg-primary-500/10 border-l-2 border-primary-500'
                          : 'hover:bg-gray-800 border-l-2 border-transparent'
                      }`}
                    >
                      <div className={`w-7 h-7 rounded-full flex items-center justify-center text-xs font-medium flex-shrink-0 ${
                        activeVideo?.id === video.id
                          ? 'bg-primary-500 text-white'
                          : 'bg-gray-800 text-gray-400'
                      }`}>
                        {activeVideo?.id === video.id ? (
                          <span className="material-symbols-outlined text-sm">play_arrow</span>
                        ) : (
                          index + 1
                        )}
                      </div>
                      <div className="flex-1 min-w-0">
                        <p className={`text-sm font-medium truncate ${
                          activeVideo?.id === video.id ? 'text-white' : 'text-gray-300'
                        }`}>
                          {video.title}
                        </p>
                        <p className="text-xs text-gray-500">
                          {video.duration > 0
                            ? `${Math.floor(video.duration / 60)}:${String(video.duration % 60).padStart(2, '0')}`
                            : ''}
                          {video.isRequired && <span className="ml-1 text-primary-400">· Obligatoire</span>}
                        </p>
                      </div>
                    </button>
                  ))}
                </div>
              </div>
            )}

            {pdfs.length > 0 && (
              <div className="p-2 border-t border-gray-800">
                <p className="text-xs font-semibold text-gray-500 uppercase tracking-wider px-2 py-2">Documents</p>
                <div className="space-y-0.5">
                  {pdfs.map((pdf) => (
                    <a
                      key={pdf.id}
                      href={`/uploads/${pdf.url}`}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors"
                    >
                      <span className="material-symbols-outlined text-lg text-red-400">picture_as_pdf</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pdf.title}</p>
                        <p className="text-xs text-gray-500">
                          {pdf.pageCount > 0 ? `${pdf.pageCount} pages` : ''}
                        </p>
                      </div>
                    </a>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  );
}
