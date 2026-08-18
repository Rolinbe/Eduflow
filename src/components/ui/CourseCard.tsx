import { useNavigate } from 'react-router-dom';
import ProgressBar from './ProgressBar';
import Badge from './Badge';
import type { Cours } from '../../types';

interface CourseCardProps {
  course: Cours;
  progress?: number;
  role?: 'ADMIN' | 'APPRENANT';
  onClick?: () => void;
}

export default function CourseCard({ course, progress, role = 'APPRENANT', onClick }: CourseCardProps) {
  const navigate = useNavigate();

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
      className="bg-white rounded-lg shadow-card overflow-hidden cursor-pointer hover:shadow-md transition-shadow duration-200 group"
    >
      <div className="h-40 bg-gradient-to-br from-primary-400 to-primary-700 relative">
        {course.coverImage && (
          <img src={course.coverImage} alt={course.title} className="w-full h-full object-cover" />
        )}
        <div className="absolute top-3 right-3">
          <Badge variant={statusMap[course.status]?.variant || 'gray'}>
            {statusMap[course.status]?.label || course.status}
          </Badge>
        </div>
        <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors" />
        <div className="absolute inset-0 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
          <div className="w-12 h-12 bg-white/90 rounded-full flex items-center justify-center">
            <span className="material-symbols-outlined text-primary-600">
              {role === 'APPRENANT' ? 'play_arrow' : 'edit'}
            </span>
          </div>
        </div>
      </div>
      <div className="p-4">
        <Badge variant="gray" size="sm">{course.category?.name || ''}</Badge>
        <h3 className="font-semibold text-gray-900 mt-2 line-clamp-1">{course.title}</h3>
        <p className="text-sm text-gray-500 mt-1 line-clamp-2">{course.description}</p>
        <div className="flex items-center gap-4 mt-3 text-xs text-gray-400">
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">videocam</span>
            {course._count?.videos || 0} vidéos
          </span>
          <span className="flex items-center gap-1">
            <span className="material-symbols-outlined text-sm">description</span>
            {course._count?.pdfs || 0} PDFs
          </span>
          {course._count?.enrollments !== undefined && (
            <span className="flex items-center gap-1">
              <span className="material-symbols-outlined text-sm">people</span>
              {course._count.enrollments}
            </span>
          )}
        </div>
        {progress !== undefined && role === 'APPRENANT' && (
          <div className="mt-3">
            <ProgressBar value={progress} size="sm" />
          </div>
        )}
      </div>
    </div>
  );
}
