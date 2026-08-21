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
  const [pdfModal, setPdfModal] = useState<Pdf | null>(null);
  const videoRef = useRef<HTMLVideoElement>(null);
  const containerRef = useRef<HTMLDivElement>(null);
  const progressRef = useRef<HTMLDivElement>(null);
  const queryClient = useQueryClient();
  const progressIntervalRef = useRef<ReturnType<typeof setInterval> | null>(null);
  const lastProgressRef = useRef(0);

  const [isPlaying, setIsPlaying] = useState(false);
  const [vidCurrentTime, setVidCurrentTime] = useState(0);
  const [duration, setDuration] = useState(0);
  const [volume, setVolume] = useState(1);
  const [isMuted, setIsMuted] = useState(false);
  const [isFullscreen, setIsFullscreen] = useState(false);

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

    const handleTimeUpdate = () => {
      setVidCurrentTime(video.currentTime);
      trackProgress();
    };
    const handleLoadedMetadata = () => setDuration(video.duration);
    const handleEnded = () => {
      setIsPlaying(false);
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
    const handlePlay = () => setIsPlaying(true);
    const handlePause = () => setIsPlaying(false);

    video.addEventListener('timeupdate', handleTimeUpdate);
    video.addEventListener('loadedmetadata', handleLoadedMetadata);
    video.addEventListener('ended', handleEnded);
    video.addEventListener('play', handlePlay);
    video.addEventListener('pause', handlePause);
    return () => {
      video.removeEventListener('timeupdate', handleTimeUpdate);
      video.removeEventListener('loadedmetadata', handleLoadedMetadata);
      video.removeEventListener('ended', handleEnded);
      video.removeEventListener('play', handlePlay);
      video.removeEventListener('pause', handlePause);
    };
  }, [activeVideo, videos, trackProgress, updateVideoProgress]);

  useEffect(() => {
    lastProgressRef.current = 0;
    setVidCurrentTime(0);
    setDuration(0);
    setIsPlaying(false);
    const video = videoRef.current;
    if (video) {
      video.load();
    }
  }, [activeVideo?.id]);

  const togglePlay = () => {
    const video = videoRef.current;
    if (!video) return;
    if (video.paused) video.play(); else video.pause();
  };

  const handleProgressClick = (e: React.MouseEvent<HTMLDivElement>) => {
    const video = videoRef.current;
    const bar = progressRef.current;
    if (!video || !bar) return;
    const rect = bar.getBoundingClientRect();
    video.currentTime = ((e.clientX - rect.left) / rect.width) * video.duration;
  };

  const formatTime = (s: number) => {
    const m = Math.floor(s / 60);
    const sec = Math.floor(s % 60);
    return `${m}:${String(sec).padStart(2, '0')}`;
  };

  const toggleFullscreen = () => {
    const el = containerRef.current;
    if (!el) return;
    if (!document.fullscreenElement) { el.requestFullscreen(); setIsFullscreen(true); }
    else { document.exitFullscreen(); setIsFullscreen(false); }
  };

  useEffect(() => {
    const handler = () => setIsFullscreen(!!document.fullscreenElement);
    document.addEventListener('fullscreenchange', handler);
    return () => document.removeEventListener('fullscreenchange', handler);
  }, []);

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

          <div ref={containerRef} className="bg-black aspect-video max-h-[60vh] relative flex-shrink-0 group">
            {activeVideo ? (
              <>
                <video
                  ref={videoRef}
                  key={activeVideo.id}
                  src={`/uploads/${activeVideo.url}`}
                  autoPlay
                  className="w-full h-full object-contain"
                  poster={activeVideo.thumbnailUrl || undefined}
                  controlsList="nodownload nofullscreen noremoteplayback"
                  disablePictureInPicture
                  onContextMenu={(e) => e.preventDefault()}
                  onKeyDown={(e) => {
                    if ((e.ctrlKey || e.metaKey) && ['s','u','S','U'].includes(e.key)) e.preventDefault();
                  }}
                >
                  Votre navigateur ne supporte pas la lecture vidéo.
                </video>

                {/* Custom Controls */}
                <div className="absolute bottom-0 left-0 right-0 bg-gradient-to-t from-black/90 via-black/50 to-transparent px-4 pb-3 pt-8 opacity-0 group-hover:opacity-100 transition-opacity duration-300">
                  <div
                    ref={progressRef}
                    onClick={handleProgressClick}
                    className="w-full h-1.5 bg-gray-600 rounded-full cursor-pointer mb-3 group/progress hover:h-2.5 transition-all"
                  >
                    <div
                      className="h-full bg-gradient-to-r from-primary-500 to-primary-400 rounded-full relative"
                      style={{ width: `${duration > 0 ? (vidCurrentTime / duration) * 100 : 0}%` }}
                    >
                      <div className="absolute right-0 top-1/2 -translate-y-1/2 w-3.5 h-3.5 bg-primary-500 rounded-full shadow-lg opacity-0 group-hover/progress:opacity-100 transition-opacity" />
                    </div>
                  </div>
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-3">
                      <button onClick={togglePlay} className="text-white hover:text-primary-400 transition-colors">
                        <span className="material-symbols-outlined text-2xl">{isPlaying ? 'pause' : 'play_arrow'}</span>
                      </button>
                      <button
                        onClick={() => {
                          const v = videoRef.current;
                          if (v) { v.muted = !v.muted; setIsMuted(!isMuted); }
                        }}
                        className="text-white hover:text-primary-400 transition-colors"
                      >
                        <span className="material-symbols-outlined text-xl">
                          {isMuted || volume === 0 ? 'volume_off' : volume < 0.5 ? 'volume_down' : 'volume_up'}
                        </span>
                      </button>
                      {!isMuted && (
                        <input
                          type="range" min="0" max="1" step="0.05" value={volume}
                          onChange={(e) => {
                            const v = parseFloat(e.target.value);
                            setVolume(v);
                            if (videoRef.current) { videoRef.current.volume = v; }
                          }}
                          className="w-20 accent-primary-500"
                        />
                      )}
                      <span className="text-white/70 text-xs font-mono">
                        {formatTime(vidCurrentTime)} / {formatTime(duration)}
                      </span>
                    </div>
                    <button onClick={toggleFullscreen} className="text-white hover:text-primary-400 transition-colors">
                      <span className="material-symbols-outlined text-xl">{isFullscreen ? 'fullscreen_exit' : 'fullscreen'}</span>
                    </button>
                  </div>
                </div>
              </>
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
                { key: 'downloads', label: 'Documents', icon: 'description' },
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
                    <button
                      key={pdf.id}
                      onClick={() => {
                        setPdfModal(pdf);
                        updatePdfProgress.mutate(pdf.id);
                      }}
                      className="w-full flex items-center justify-between p-3 border border-gray-100 rounded-lg hover:bg-gray-50 transition-colors text-left"
                    >
                      <div className="flex items-center gap-3">
                        <span className="material-symbols-outlined text-xl text-red-500">picture_as_pdf</span>
                        <div>
                          <p className="text-sm font-medium text-gray-900">{pdf.title}</p>
                          {pdf.description && <p className="text-xs text-gray-400">{pdf.description}</p>}
                        </div>
                      </div>
                      <span className="flex items-center gap-1 px-3 py-1.5 bg-gray-100 text-gray-700 text-xs font-medium rounded-lg">
                        <span className="material-symbols-outlined text-sm">visibility</span>
                        Consulter
                      </span>
                    </button>
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
                    <button
                      key={pdf.id}
                      onClick={() => { setPdfModal(pdf); updatePdfProgress.mutate(pdf.id); }}
                      className="w-full flex items-center gap-3 px-3 py-2.5 rounded-lg text-gray-300 hover:bg-gray-800 transition-colors text-left"
                    >
                      <span className="material-symbols-outlined text-lg text-red-400">picture_as_pdf</span>
                      <div className="flex-1 min-w-0">
                        <p className="text-sm font-medium truncate">{pdf.title}</p>
                        <p className="text-xs text-gray-500">
                          {pdf.pageCount > 0 ? `${pdf.pageCount} pages` : ''}
                        </p>
                      </div>
                      <span className="material-symbols-outlined text-sm text-gray-500">visibility</span>
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* PDF Modal - Visionneuse inline */}
      {pdfModal && (
        <div className="fixed inset-0 z-50 bg-black/80 flex items-center justify-center p-4" onClick={() => setPdfModal(null)}>
          <div className="bg-white dark:bg-dark-800 rounded-2xl shadow-2xl w-full max-w-5xl h-[90vh] flex flex-col overflow-hidden" onClick={(e) => e.stopPropagation()}>
            <div className="flex items-center justify-between px-6 py-4 border-b border-gray-200 dark:border-dark-600">
              <div className="flex items-center gap-3">
                <span className="material-symbols-outlined text-xl text-red-500">picture_as_pdf</span>
                <div>
                  <h3 className="font-bold text-gray-900 dark:text-white">{pdfModal.title}</h3>
                  {pdfModal.description && <p className="text-xs text-gray-500 dark:text-dark-400">{pdfModal.description}</p>}
                </div>
              </div>
              <button onClick={() => setPdfModal(null)} className="w-9 h-9 flex items-center justify-center rounded-lg hover:bg-gray-100 dark:hover:bg-dark-700 transition-colors">
                <span className="material-symbols-outlined text-gray-500 dark:text-dark-400">close</span>
              </button>
            </div>
            <div className="flex-1 overflow-hidden">
              <iframe
                src={`/uploads/${pdfModal.url}#toolbar=0&navpanes=0&scrollbar=0`}
                className="w-full h-full border-0"
                title={pdfModal.title}
              />
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
