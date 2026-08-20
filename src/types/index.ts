export interface User {
  id: number;
  firstName: string;
  lastName: string;
  email: string;
  role: 'ADMIN' | 'APPRENANT' | 'MENTOR';
  status: 'ACTIF' | 'INACTIF' | 'BLOQUE';
  niveau?: 'SIXIEME' | 'CINQUIEME' | 'QUATRIEME' | 'TROISIEME' | 'SECONDE' | 'PREMIERE' | 'TERMINALE' | null;
  serie?: 'S' | 'L' | 'OSE' | null;
  niveauResponsable?: 'SIXIEME' | 'CINQUIEME' | 'QUATRIEME' | 'TROISIEME' | 'SECONDE' | 'PREMIERE' | 'TERMINALE' | null;
  serieResponsable?: 'S' | 'L' | 'OSE' | null;
  avatar?: string | null;
  lastLogin?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Category {
  id: number;
  name: string;
  slug: string;
}

export interface Cours {
  id: number;
  title: string;
  description?: string | null;
  coverImage?: string | null;
  status: 'PUBLIE' | 'BROUILLON' | 'ARCHIVE';
  categoryId?: number | null;
  adminId: number;
  niveau?: 'SIXIEME' | 'CINQUIEME' | 'QUATRIEME' | 'TROISIEME' | 'SECONDE' | 'PREMIERE' | 'TERMINALE' | null;
  serie?: 'S' | 'L' | 'OSE' | null;
  category?: Category;
  admin?: { id: number; firstName: string; lastName: string };
  _count?: { videos: number; pdfs: number; enrollments?: number };
  videos?: Video[];
  pdfs?: Pdf[];
  modules?: Module[];
  createdAt: string;
  updatedAt: string;
}

export interface Video {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  thumbnailUrl?: string | null;
  duration: number;
  position: number;
  isRequired: boolean;
  courseId: number;
  createdAt: string;
}

export interface Pdf {
  id: number;
  title: string;
  description?: string | null;
  url: string;
  pageCount: number;
  position: number;
  courseId: number;
  createdAt: string;
}

export interface Module {
  id: number;
  title: string;
  position: number;
  courseId: number;
  lessons: Lesson[];
}

export interface Lesson {
  id: number;
  title: string;
  type: string;
  videoUrl?: string | null;
  content?: string | null;
  duration: number;
  position: number;
  moduleId: number;
}

export interface Enrollment {
  id: number;
  userId: number;
  courseId: number;
  progress: number;
  enrolledAt: string;
  cours?: Cours;
}

export interface Progression {
  id: number;
  userId: number;
  coursId: number;
  lessonId?: number | null;
  status: 'NON_VU' | 'EN_COURS' | 'TERMINE';
  timeSpent: number;
  position: number;
  lastAccessed?: string | null;
}

export interface GlobalProgression {
  summary: {
    totalEnrolled: number;
    completedCourses: number;
    inProgressCourses: number;
    notStarted: number;
    averageProgress: number;
    totalTimeSpent: number;
    totalCertificates: number;
  };
  enrollments: Enrollment[];
  recentProgressions: Progression[];
}

export interface Commentaire {
  id: number;
  content: string;
  userId: number;
  coursId: number;
  lessonId?: number | null;
  parentId?: number | null;
  user?: User;
  likes?: Like[];
  replies?: Commentaire[];
  _count?: { likes: number };
  createdAt: string;
}

export interface Like {
  id: number;
  userId: number;
  commentaireId: number;
}

export interface Notification {
  id: number;
  userId: number;
  type: 'INFO' | 'SUCCES' | 'WARNING' | 'ERROR' | 'CERTIFICAT' | 'ANNONCE';
  title: string;
  message: string;
  isRead: boolean;
  createdAt: string;
}

export interface Certificate {
  id: number;
  userId: number;
  coursId: number;
  uniqueNumber: string;
  verificationKey: string;
  status: 'VALIDE' | 'REVOQUE';
  issuedAt: string;
  cours?: Cours;
}

export interface Stats {
  totalStudents: number;
  totalCourses: number;
  activeCourses: number;
  totalVideos: number;
  totalPdfs: number;
  totalEnrollments: number;
  averageCompletion: number;
  newEnrollments: number;
  monthlyEnrollments: { month: number; count: number }[];
  popularCourses: { title: string; enrollments: number }[];
  recentActivities: { id: number; type: string; message: string; date: string }[];
  totalCertificates: number;
  totalComments: number;
}

export interface AuthResponse {
  message: string;
  user: User;
  token: string;
  refreshToken: string;
}

export interface PaginatedResponse<T> {
  data: T[];
  total: number;
  page: number;
  limit: number;
  totalPages: number;
}

export interface ChatMessage {
  id: number;
  conversationId: number;
  senderId: number;
  content: string;
  status: 'SENT' | 'DELIVERED' | 'READ';
  createdAt: string;
  sender?: User;
}

export interface Conversation {
  id: number;
  otherUser: User;
  lastMessage?: ChatMessage | null;
  unreadCount: number;
  updatedAt: string;
}

export interface Announcement {
  id: number;
  title: string;
  content: string;
  adminId: number;
  admin?: { id: number; firstName: string; lastName: string };
  createdAt: string;
  updatedAt: string;
}
