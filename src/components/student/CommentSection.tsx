import { useState } from 'react';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import api from '../../services/api';
import LoadingSpinner from '../ui/LoadingSpinner';
import toast from 'react-hot-toast';
import { useAuthStore } from '../../stores/authStore';
import type { Commentaire } from '../../types';

interface CommentSectionProps {
  coursId: string;
}

export default function CommentSection({ coursId }: CommentSectionProps) {
  const [newComment, setNewComment] = useState('');
  const [replyTo, setReplyTo] = useState<number | null>(null);
  const [replyContent, setReplyContent] = useState('');
  const queryClient = useQueryClient();
  const { user } = useAuthStore();

  const { data: commentaires, isLoading } = useQuery({
    queryKey: ['commentaires', coursId],
    queryFn: async () => {
      const res = await api.get(`/apprenant/cours/${coursId}/commentaires`);
      return (res.data.commentaires || res.data) as Commentaire[];
    },
  });

  const postMutation = useMutation({
    mutationFn: async (content: string) =>
      api.post(`/apprenant/cours/${coursId}/commentaires`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentaires', coursId] });
      setNewComment('');
      toast.success('Commentaire publié');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const replyMutation = useMutation({
    mutationFn: async ({ commentId, content }: { commentId: number; content: string }) =>
      api.post(`/apprenant/commentaires/${commentId}/reply`, { content }),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentaires', coursId] });
      setReplyTo(null);
      setReplyContent('');
      toast.success('Réponse publiée');
    },
    onError: (err: any) => toast.error(err.response?.data?.error || 'Erreur'),
  });

  const likeMutation = useMutation({
    mutationFn: async (commentId: number) =>
      api.post(`/apprenant/commentaires/${commentId}/like`),
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['commentaires', coursId] });
    },
  });

  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!newComment.trim()) return;
    postMutation.mutate(newComment);
  };

  const handleReply = (commentId: number) => {
    if (!replyContent.trim()) return;
    replyMutation.mutate({ commentId, content: replyContent });
  };

  if (isLoading) return <LoadingSpinner className="py-8" />;

  return (
    <div>
      <form onSubmit={handleSubmit} className="mb-6">
        <textarea
          value={newComment}
          onChange={(e) => setNewComment(e.target.value)}
          rows={3}
          className="w-full px-4 py-3 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-transparent resize-none transition-all duration-200"
          placeholder="Posez une question ou laissez un commentaire..."
        />
        <div className="flex justify-end mt-2">
          <button
            type="submit"
            disabled={!newComment.trim() || postMutation.isPending}
            className="px-4 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 transition-all duration-200 disabled:opacity-50 hover:shadow-lg hover:shadow-primary-500/25 active:scale-[0.98]"
          >
            {postMutation.isPending ? 'Envoi...' : 'Publier'}
          </button>
        </div>
      </form>

      <div className="space-y-4">
        {commentaires?.map((comment) => (
          <div key={comment.id} className="border border-gray-100 dark:border-dark-700 rounded-lg p-4 bg-white dark:bg-dark-800 transition-all duration-200 hover:shadow-sm">
            <div className="flex items-center gap-3">
              <div className="w-8 h-8 bg-primary-100 rounded-full flex items-center justify-center">
                <span className="text-xs font-semibold text-primary-700">
                  {comment.user?.firstName?.[0]}{comment.user?.lastName?.[0]}
                </span>
              </div>
              <div>
                <p className="text-sm font-medium text-gray-900 dark:text-white transition-colors duration-200">
                  {comment.user?.firstName} {comment.user?.lastName}
                </p>
                <p className="text-xs text-gray-400 dark:text-dark-400 transition-colors duration-200">
                  {new Date(comment.createdAt).toLocaleDateString('fr-FR', {
                    day: 'numeric', month: 'short', year: 'numeric', hour: '2-digit', minute: '2-digit',
                  })}
                </p>
              </div>
            </div>
            <p className="text-sm text-gray-600 dark:text-dark-300 mt-3 transition-colors duration-200">{comment.content}</p>
            <div className="flex items-center gap-4 mt-3">
              <button
                onClick={() => likeMutation.mutate(comment.id)}
                className={`flex items-center gap-1 text-xs transition-all duration-200 ${
                  comment.likes?.some((l) => l.userId === user?.id)
                    ? 'text-primary-500'
                    : 'text-gray-400 dark:text-dark-400 hover:text-primary-500'
                }`}
              >
                <span className="material-symbols-outlined text-sm">
                  {comment.likes?.some((l) => l.userId === user?.id) ? 'thumb_up' : 'thumb_up'}
                </span>
                {comment._count?.likes || 0}
              </button>
              <button
                onClick={() => setReplyTo(replyTo === comment.id ? null : comment.id)}
                className="flex items-center gap-1 text-xs text-gray-400 dark:text-dark-400 hover:text-primary-500 transition-all duration-200"
              >
                <span className="material-symbols-outlined text-sm">reply</span>
                Répondre
              </button>
            </div>

            {replyTo === comment.id && (
              <div className="mt-3 flex gap-2">
                <input
                  type="text"
                  value={replyContent}
                  onChange={(e) => setReplyContent(e.target.value)}
                  placeholder="Votre réponse..."
                  className="flex-1 px-3 py-2 border border-gray-200 dark:border-dark-600 rounded-lg text-sm bg-white dark:bg-dark-800 dark:text-white focus:outline-none focus:ring-2 focus:ring-primary-500 transition-all duration-200"
                  onKeyDown={(e) => { if (e.key === 'Enter') handleReply(comment.id); }}
                />
                <button
                  onClick={() => handleReply(comment.id)}
                  disabled={!replyContent.trim() || replyMutation.isPending}
                  className="px-3 py-2 bg-primary-500 text-white text-sm font-medium rounded-lg hover:bg-primary-600 disabled:opacity-50 transition-all duration-200 hover:shadow-md active:scale-[0.98]"
                >
                  <span className="material-symbols-outlined text-sm">send</span>
                </button>
              </div>
            )}

            {comment.replies && comment.replies.length > 0 && (
              <div className="mt-3 ml-8 space-y-3 border-l-2 border-gray-100 dark:border-dark-700 pl-4 transition-colors duration-200">
                {comment.replies.map((reply) => (
                  <div key={reply.id}>
                    <div className="flex items-center gap-2">
                      <div className="w-6 h-6 bg-gray-100 dark:bg-dark-700 rounded-full flex items-center justify-center transition-colors duration-200">
                        <span className="text-[10px] font-semibold text-gray-500 dark:text-dark-300 transition-colors duration-200">
                          {reply.user?.firstName?.[0]}{reply.user?.lastName?.[0]}
                        </span>
                      </div>
                      <p className="text-xs font-medium text-gray-700 dark:text-dark-200 transition-colors duration-200">
                        {reply.user?.firstName} {reply.user?.lastName}
                      </p>
                      <span className="text-xs text-gray-400 dark:text-dark-400 transition-colors duration-200">
                        {new Date(reply.createdAt).toLocaleDateString('fr-FR')}
                      </span>
                    </div>
                    <p className="text-sm text-gray-600 dark:text-dark-300 mt-1 ml-8 transition-colors duration-200">{reply.content}</p>
                  </div>
                ))}
              </div>
            )}
          </div>
        ))}
        {commentaires?.length === 0 && (
          <p className="text-sm text-gray-400 dark:text-dark-400 text-center py-4 transition-colors duration-200">
            Aucun commentaire. Soyez le premier à poser une question!
          </p>
        )}
      </div>
    </div>
  );
}
