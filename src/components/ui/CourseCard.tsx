import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import Badge from './Badge';
import type { Cours } from '../../types';

const gradientColors = [
  'from-blue-400 to-indigo-500',
  'from-emerald-400 to-teal-500',
  'from-violet-400 to-purple-500',
  'from-amber-400 to-orange-500',
  'from-rose-400 to-pink-500',
  'from-cyan-400 to-sky-500',
];

function hashStr(s: string): number {
  let h = 0;
  for (let i = 0; i < s.length; i++) h = ((h << 5) - h + s.charCodeAt(i)) | 0;
  return Math.abs(h);
}

interface CourseCardProps {
  course: Cours;
  progress?: number;
  role?: 'ADMIN' | 'APPRENANT';
  onClick?: () => void;
}

export default function CourseCard({ course, progress, role = 'APPRENANT', onClick }: CourseCardProps) {
  const navigate = useNavigate();
  const gradient = gradientColors[hashStr(course.title || '') % gradientColors.length];

  const statusMap: Record<string, { label: string; variant: 'success' | 'warning' | 'gray' }> = {
    PUBLIE: { label: 'Publié', variant: 'success' },
    BROUILLON: { label: 'Brouillon', variant: 'warning' },
    ARCHIVE: { label: 'Archivé', variant: 'gray' },
  };

  const handleClick = () => {
    if (onClick) {
      onClick();
    } else if (role === 'APPRENANT') {
      navigate(`/student/course/${course.id}`);
    } else {
      navigate(`/admin/courses`);
    }
  };

  return (
    <div
      onClick={handleClick}
      className="bg-white dark:bg-dark-800 rounded-2xl shadow-sm dark:shadow-card-dark overflow-hidden cursor-pointer card-hover group transition-all duration-300 hover:-translate-y-1 hover:shadow-xl ring-1 ring-gray-100 dark:ring-dark-700"
    >
      <div className={`h-40 bg-gradient-to-br ${gradient} relative`}>
        {course.coverImage && (
          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant={statusMap[course.status]?.variant || 'gray'}>
            {statusMap[course.status]?.label || course.status}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-all duration-300 group-hover:scale-110">
          <div className="w-14 h-14 bg-white/90 dark:bg-dark-800/90 rounded-full flex items-center justify-center shadow-lg">
            <span className="material-symbols-outlined text-primary-600 text-2xl">
              {role === 'APPRENANT' ? 'play_arrow' : 'edit'}
            </span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <Badge variant="gray" size="sm">{course.category?.name || ''}</Badge>
        <h3 className="font-bold text-gray-900 dark:text-white mt-2 line-clamp-1 transition-colors duration-200">{course.title}</h3>
        <p className="text-sm text-gray-500 dark:text-dark-400 mt-1 line-clamp-2 transition-colors duration-200">{course.description}</p>
        <div className="flex items-center gap-3 mt-3 text-xs text-gray-400 dark:text-dark-400 transition-colors duration-200">
          <span className="flex items-center gap-1 px-2 py-1 bg-blue-50 dark:bg-blue-900/20 rounded-lg">
            <span className="material-symbols-outlined text-sm text-blue-500">videocam</span>
            <span className="font-medium">{course._count?.videos || 0}</span>
          </span>
          <span className="flex items-center gap-1 px-2 py-1 bg-amber-50 dark:bg-amber-900/20 rounded-lg">
            <span className="material-symbols-outlined text-sm text-amber-500">description</span>
            <span className="font-medium">{course._count?.pdfs || 0}</span>
          </span>
          {course._count?.enrollments !== undefined && (
            <span className="flex items-center gap-1 px-2 py-1 bg-emerald-50 dark:bg-emerald-900/20 rounded-lg">
              <span className="material-symbols-outlined text-sm text-emerald-500">people</span>
              <span className="font-medium">{course._count.enrollments}</span>
            </span>
          )}
        </div>
        {progress !== undefined && role === 'APPRENANT' && (
          <div className="mt-3">
            <div className="flex justify-between text-xs text-gray-500 dark:text-dark-400 mb-1">
              <span>Progression</span>
              <span className="font-bold text-emerald-600 dark:text-emerald-400">{progress}%</span>
            </div>
            <ProgressBar value={progress} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
