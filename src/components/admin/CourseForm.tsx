import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';

const niveauValues = ['SIXIEME', 'CINQUIEME', 'QUATRIEME', 'TROISIEME', 'SECONDE', 'PREMIERE', 'TERMINALE'] as const;
const serieValues = ['S', 'L', 'OSE'] as const;

const niveauLabels: Record<string, string> = {
  SIXIEME: '6ème', CINQUIEME: '5ème', QUATRIEME: '4ème', TROISIEME: '3ème',
  SECONDE: 'Seconde', PREMIERE: 'Première', TERMINALE: 'Terminale',
};

const courseSchema = z.object({
  title: z.string().min(1, 'Le titre est requis'),
  description: z.string().optional(),
  categoryId: z.string().optional(),
  status: z.enum(['PUBLIE', 'BROUILLON', 'ARCHIVE']),
  niveau: z.string().optional(),
  serie: z.string().optional(),
});

type CourseFormData = z.infer<typeof courseSchema>;

interface CourseFormProps {
  initialData?: {
    id?: number;
    title: string;
    description?: string | null;
    categoryId?: number | null;
    status: string;
    niveau?: string | null;
    serie?: string | null;
    category?: { name: string };
  };
  categories: { id: number; name: string }[];
  onSubmit: (data: any) => void;
  onClose: () => void;
  isLoading?: boolean;
}

export default function CourseForm({ initialData, categories, onSubmit, onClose, isLoading }: CourseFormProps) {
  const {
    register,
    handleSubmit,
    watch,
    formState: { errors },
  } = useForm<CourseFormData>({
    resolver: zodResolver(courseSchema),
    defaultValues: {
      title: initialData?.title || '',
      description: initialData?.description || '',
      categoryId: initialData?.categoryId ? String(initialData.categoryId) : '',
      status: (initialData?.status as any) || 'BROUILLON',
      niveau: initialData?.niveau || '',
      serie: initialData?.serie || '',
    },
  });

  const selectedNiveau = watch('niveau');

  const onSubmitHandler = (data: CourseFormData) => {
    const payload: any = {
      title: data.title,
    };
    if (data.description) {
      payload.description = data.description;
    }
    if (data.categoryId) {
      payload.categoryId = Number(data.categoryId);
    }
    if (data.status) {
      payload.status = data.status;
    }
    if (data.niveau) {
      payload.niveau = data.niveau;
    }
    if ((data.niveau === 'TERMINALE' || data.niveau === 'PREMIERE') && data.serie) {
      payload.serie = data.serie;
    }
    onSubmit(payload);
  };

  const inputClass = "w-full px-4 py-2.5 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent transition-all duration-200";
  const labelClass = "block text-sm font-medium text-gray-700 dark:text-dark-200 mb-1 transition-colors duration-200";

  return (
    <form onSubmit={handleSubmit(onSubmitHandler)} className="space-y-4">
      <div>
        <label className={labelClass}>Titre</label>
        <input
          {...register('title')}
          className={inputClass}
          placeholder="Titre du cours"
        />
        {errors.title && <p className="text-xs text-danger mt-1">{errors.title.message}</p>}
      </div>

      <div>
        <label className={labelClass}>Description</label>
        <textarea
          {...register('description')}
          rows={3}
          className={`${inputClass} resize-none`}
          placeholder="Description du cours (optionnel)"
        />
        {errors.description && <p className="text-xs text-danger mt-1">{errors.description.message}</p>}
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Catégorie</label>
          <select
            {...register('categoryId')}
            className={inputClass}
          >
            <option value="">Sélectionner</option>
            {categories.map((cat) => (
              <option key={cat.id} value={cat.id}>{cat.name}</option>
            ))}
          </select>
        </div>

        <div>
          <label className={labelClass}>Statut</label>
          <select
            {...register('status')}
            className={inputClass}
          >
            <option value="BROUILLON">Brouillon</option>
            <option value="PUBLIE">Publié</option>
            <option value="ARCHIVE">Archivé</option>
          </select>
        </div>
      </div>

      <div className="grid grid-cols-2 gap-4">
        <div>
          <label className={labelClass}>Niveau</label>
          <select
            {...register('niveau')}
            className={inputClass}
          >
            <option value="">Tous les niveaux</option>
            {niveauValues.map((n) => (
              <option key={n} value={n}>{niveauLabels[n]}</option>
            ))}
          </select>
        </div>

        {(selectedNiveau === 'TERMINALE' || selectedNiveau === 'PREMIERE') && (
          <div>
            <label className={labelClass}>Série</label>
            <select
              {...register('serie')}
              className={inputClass}
            >
              <option value="">Toutes les séries</option>
              {serieValues.map((s) => (
                <option key={s} value={s}>Série {s}</option>
              ))}
            </select>
          </div>
        )}
      </div>

      <div className="flex justify-end gap-3 pt-4 border-t border-gray-100 dark:border-dark-700 transition-colors duration-200">
        <button
          type="button"
          onClick={onClose}
          className="px-4 py-2 text-sm font-medium text-gray-600 dark:text-dark-300 bg-gray-100 dark:bg-dark-700 rounded-lg hover:bg-gray-200 dark:hover:bg-dark-600 transition-all duration-200"
        >
          Annuler
        </button>
        <button
          type="submit"
          disabled={isLoading}
          className="px-4 py-2 text-sm font-medium text-white bg-primary-500 rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
        >
          {isLoading ? 'Enregistrement...' : initialData?.id ? 'Modifier' : 'Créer'}
        </button>
      </div>
    </form>
  );
}
