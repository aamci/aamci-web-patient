'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Star,
  Clock,
  Calendar,
  User,
  MessageSquare,
  ChevronRight,
  Edit3,
  Trash2,
  Check,
  X,
  AlertTriangle,
  RefreshCw,
  ArrowLeft,
  Award,
} from 'lucide-react';

interface Review {
  id: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string;
  appointmentId?: string;
  appointmentDate?: string;
  rating: number;
  comment: string;
  createdAt: string;
  updatedAt?: string;
  isPublic: boolean;
  response?: {
    text: string;
    date: string;
  };
}

interface PendingReview {
  appointmentId: string;
  doctorId: string;
  doctorName: string;
  doctorSpecialty: string;
  doctorAvatar?: string;
  appointmentDate: string;
}

export default function ReviewsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [reviews, setReviews] = useState<Review[]>([]);
  const [pendingReviews, setPendingReviews] = useState<PendingReview[]>([]);
  const [activeTab, setActiveTab] = useState<'pending' | 'submitted'>('pending');

  // Edit mode
  const [editingReview, setEditingReview] = useState<Review | null>(null);
  const [editRating, setEditRating] = useState(0);
  const [editComment, setEditComment] = useState('');

  // Submit review modal
  const [showSubmitModal, setShowSubmitModal] = useState(false);
  const [selectedPending, setSelectedPending] = useState<PendingReview | null>(null);
  const [submitRating, setSubmitRating] = useState(0);
  const [submitComment, setSubmitComment] = useState('');
  const [submitIsPublic, setSubmitIsPublic] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const loadData = useCallback(async () => {
    try {
      const token = localStorage.getItem('token');
      const headers = { Authorization: `Bearer ${token}` };

      const [pendingRes, myReviewsRes] = await Promise.all([
        fetch(`${apiBaseUrl}/reviews/pending`, { headers }),
        fetch(`${apiBaseUrl}/reviews/my-reviews`, { headers }),
      ]);

      if (pendingRes.ok) {
        const data = await pendingRes.json();
        setPendingReviews((data || []).map((p: any) => ({
          appointmentId: p.appointmentId || p.id,
          doctorId: p.doctorId || p.doctor?.userId || '',
          doctorName: p.doctorName || p.doctor?.user?.fullName || 'Médecin',
          doctorSpecialty: p.doctorSpecialty || p.doctor?.specialty || '',
          doctorAvatar: p.doctorAvatar || p.doctor?.user?.avatarUrl,
          appointmentDate: p.appointmentDate || p.date || p.createdAt,
        })));
      }

      if (myReviewsRes.ok) {
        const data = await myReviewsRes.json();
        setReviews((data || []).map((r: any) => ({
          id: r.id,
          doctorId: r.doctorProfileId || r.doctorId || '',
          doctorName: r.doctorProfile?.user?.fullName || r.doctorName || 'Médecin',
          doctorSpecialty: r.doctorProfile?.specialty || r.doctorSpecialty || '',
          doctorAvatar: r.doctorProfile?.user?.avatarUrl,
          appointmentId: r.appointmentId,
          appointmentDate: r.appointment?.slot?.start || r.appointmentDate,
          rating: r.overallRating || r.rating || 0,
          comment: r.comment || '',
          createdAt: r.createdAt,
          updatedAt: r.updatedAt,
          isPublic: r.isPublic ?? true,
          response: r.doctorResponse ? { text: r.doctorResponse, date: r.doctorRespondedAt } : undefined,
        })));
      }
    } catch (error) {
      console.error('Error loading reviews:', error);
    } finally {
      setLoading(false);
    }
  }, [apiBaseUrl]);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadData();
  }, [router, loadData]);

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const openSubmitModal = (pending: PendingReview) => {
    setSelectedPending(pending);
    setSubmitRating(0);
    setSubmitComment('');
    setSubmitIsPublic(true);
    setShowSubmitModal(true);
  };

  const handleSubmitReview = async () => {
    if (!selectedPending || submitRating === 0) return;

    setSubmitting(true);
    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/reviews`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          doctorId: selectedPending.doctorId,
          appointmentId: selectedPending.appointmentId,
          overallRating: submitRating,
          comment: submitComment,
          isPublic: submitIsPublic,
        }),
      });

      if (res.ok) {
        setPendingReviews(prev => prev.filter(p => p.appointmentId !== selectedPending.appointmentId));
        setShowSubmitModal(false);
        setActiveTab('submitted');
        loadData();
      }
    } catch (error) {
      console.error('Error submitting review:', error);
    } finally {
      setSubmitting(false);
    }
  };

  const startEditReview = (review: Review) => {
    setEditingReview(review);
    setEditRating(review.rating);
    setEditComment(review.comment);
  };

  const saveEditReview = async () => {
    if (!editingReview) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/reviews/${editingReview.id}`, {
        method: 'PUT',
        headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
        body: JSON.stringify({
          overallRating: editRating,
          comment: editComment,
        }),
      });

      if (res.ok) {
        setReviews(prev => prev.map(r =>
          r.id === editingReview.id
            ? { ...r, rating: editRating, comment: editComment, updatedAt: new Date().toISOString() }
            : r
        ));
        setEditingReview(null);
      }
    } catch (error) {
      console.error('Error updating review:', error);
    }
  };

  const deleteReview = async (reviewId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer cet avis ?')) return;

    try {
      const token = localStorage.getItem('token');
      const res = await fetch(`${apiBaseUrl}/reviews/${reviewId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setReviews(prev => prev.filter(r => r.id !== reviewId));
      }
    } catch (error) {
      console.error('Error deleting review:', error);
    }
  };

  const getInitials = (name: string) => {
    const parts = name.replace('Dr. ', '').split(' ');
    if (parts.length >= 2) {
      return (parts[0][0] + parts[1][0]).toUpperCase();
    }
    return name.slice(0, 2).toUpperCase();
  };

  const StarRating = ({
    rating,
    onRate,
    size = 'md',
    interactive = false,
  }: {
    rating: number;
    onRate?: (rating: number) => void;
    size?: 'sm' | 'md' | 'lg';
    interactive?: boolean;
  }) => {
    const [hoverRating, setHoverRating] = useState(0);
    const sizeClasses = {
      sm: 'w-4 h-4',
      md: 'w-6 h-6',
      lg: 'w-8 h-8',
    };

    return (
      <div className="flex gap-1">
        {[1, 2, 3, 4, 5].map(star => (
          <button
            key={star}
            type="button"
            disabled={!interactive}
            onClick={() => onRate?.(star)}
            onMouseEnter={() => interactive && setHoverRating(star)}
            onMouseLeave={() => setHoverRating(0)}
            className={interactive ? 'cursor-pointer' : 'cursor-default'}
          >
            <Star
              className={`${sizeClasses[size]} ${
                star <= (hoverRating || rating)
                  ? 'text-amber-400 fill-amber-400'
                  : 'text-slate-600'
              } transition-colors`}
            />
          </button>
        ))}
      </div>
    );
  };

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-slate-400">Chargement des avis...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      <div className="max-w-4xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center gap-4 mb-6">
          <button
            onClick={() => router.back()}
            className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
          >
            <ArrowLeft className="w-5 h-5 text-slate-400" />
          </button>
          <div>
            <h1 className="text-2xl font-bold text-white flex items-center gap-3">
              <Star className="w-7 h-7 text-amber-400" />
              Mes Avis
            </h1>
            <p className="text-slate-400 text-sm">Évaluez vos consultations et consultez vos avis</p>
          </div>
        </div>

        {/* Tabs */}
        <div className="flex gap-2 mb-6">
          <button
            onClick={() => setActiveTab('pending')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'pending'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <Clock className="w-4 h-4" />
            À évaluer
            {pendingReviews.length > 0 && (
              <span className="px-1.5 py-0.5 bg-red-500 text-white text-xs rounded-full">
                {pendingReviews.length}
              </span>
            )}
          </button>
          <button
            onClick={() => setActiveTab('submitted')}
            className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium transition-colors ${
              activeTab === 'submitted'
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 text-slate-400 hover:text-white'
            }`}
          >
            <MessageSquare className="w-4 h-4" />
            Mes avis ({reviews.length})
          </button>
        </div>

        {/* Pending Reviews Tab */}
        {activeTab === 'pending' && (
          <div className="space-y-4">
            {pendingReviews.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <Award className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucune consultation à évaluer</h3>
                <p className="text-slate-400 text-sm">
                  Vos prochaines consultations apparaîtront ici après le rendez-vous
                </p>
              </div>
            ) : (
              <>
                <div className="bg-amber-500/10 border border-amber-500/30 rounded-xl p-4">
                  <p className="text-amber-400 text-sm flex items-center gap-2">
                    <AlertTriangle className="w-4 h-4" />
                    Vos avis aident les autres patients à trouver le bon médecin
                  </p>
                </div>

                {pendingReviews.map(pending => (
                  <div
                    key={pending.appointmentId}
                    className="bg-slate-800 rounded-xl border border-slate-700 p-5"
                  >
                    <div className="flex items-center gap-4">
                      <div className="w-14 h-14 rounded-full bg-teal-600 flex items-center justify-center text-lg font-bold text-white">
                        {getInitials(pending.doctorName)}
                      </div>
                      <div className="flex-1">
                        <h3 className="font-semibold text-white">{pending.doctorName}</h3>
                        <p className="text-sm text-slate-400">{pending.doctorSpecialty}</p>
                        <p className="text-xs text-slate-500 mt-1 flex items-center gap-1">
                          <Calendar className="w-3 h-3" />
                          Consultation du {formatDate(pending.appointmentDate)}
                        </p>
                      </div>
                      <button
                        onClick={() => openSubmitModal(pending)}
                        className="px-4 py-2 bg-teal-600 text-white rounded-xl text-sm font-medium hover:bg-teal-500 transition-colors flex items-center gap-2"
                      >
                        <Star className="w-4 h-4" />
                        Évaluer
                      </button>
                    </div>
                  </div>
                ))}
              </>
            )}
          </div>
        )}

        {/* Submitted Reviews Tab */}
        {activeTab === 'submitted' && (
          <div className="space-y-4">
            {reviews.length === 0 ? (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-8 text-center">
                <MessageSquare className="w-12 h-12 text-slate-600 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-white mb-2">Aucun avis soumis</h3>
                <p className="text-slate-400 text-sm">
                  Vos avis apparaîtront ici après les avoir soumis
                </p>
              </div>
            ) : (
              reviews.map(review => (
                <div
                  key={review.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden"
                >
                  {/* Review header */}
                  <div className="p-5">
                    <div className="flex items-start gap-4">
                      <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                        {getInitials(review.doctorName)}
                      </div>
                      <div className="flex-1">
                        <div className="flex items-start justify-between">
                          <div>
                            <h3 className="font-semibold text-white">{review.doctorName}</h3>
                            <p className="text-sm text-slate-400">{review.doctorSpecialty}</p>
                          </div>
                          <div className="flex items-center gap-2">
                            <button
                              onClick={() => startEditReview(review)}
                              className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                            >
                              <Edit3 className="w-4 h-4" />
                            </button>
                            <button
                              onClick={() => deleteReview(review.id)}
                              className="p-2 text-slate-400 hover:text-red-400 hover:bg-red-500/10 rounded-lg transition-colors"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>

                        {editingReview?.id === review.id ? (
                          // Edit mode
                          <div className="mt-4 space-y-4">
                            <div>
                              <label className="block text-sm text-slate-400 mb-2">Votre note</label>
                              <StarRating
                                rating={editRating}
                                onRate={setEditRating}
                                size="lg"
                                interactive
                              />
                            </div>
                            <div>
                              <label className="block text-sm text-slate-400 mb-2">Votre commentaire</label>
                              <textarea
                                value={editComment}
                                onChange={e => setEditComment(e.target.value)}
                                rows={3}
                                className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-teal-500"
                              />
                            </div>
                            <div className="flex gap-2">
                              <button
                                onClick={saveEditReview}
                                className="px-4 py-2 bg-teal-600 text-white rounded-lg text-sm font-medium hover:bg-teal-500 flex items-center gap-2"
                              >
                                <Check className="w-4 h-4" />
                                Enregistrer
                              </button>
                              <button
                                onClick={() => setEditingReview(null)}
                                className="px-4 py-2 bg-slate-700 text-slate-300 rounded-lg text-sm font-medium hover:bg-slate-600"
                              >
                                Annuler
                              </button>
                            </div>
                          </div>
                        ) : (
                          // View mode
                          <>
                            <div className="flex items-center gap-3 mt-3">
                              <StarRating rating={review.rating} size="sm" />
                              <span className="text-sm text-slate-400">
                                {formatDate(review.createdAt)}
                                {review.updatedAt && ' (modifié)'}
                              </span>
                            </div>
                            <p className="text-slate-300 mt-3">{review.comment}</p>
                            {!review.isPublic && (
                              <span className="inline-flex items-center gap-1 mt-2 text-xs text-amber-400 bg-amber-500/10 px-2 py-1 rounded-full">
                                Avis privé
                              </span>
                            )}
                          </>
                        )}
                      </div>
                    </div>
                  </div>

                  {/* Doctor response */}
                  {review.response && editingReview?.id !== review.id && (
                    <div className="bg-slate-700/30 border-t border-slate-700 p-5">
                      <div className="flex items-start gap-3">
                        <div className="w-8 h-8 rounded-full bg-teal-600/20 flex items-center justify-center">
                          <User className="w-4 h-4 text-teal-400" />
                        </div>
                        <div>
                          <p className="text-sm text-slate-400 mb-1">
                            Réponse du médecin • {formatDate(review.response.date)}
                          </p>
                          <p className="text-slate-300 text-sm">{review.response.text}</p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              ))
            )}
          </div>
        )}

        {/* Submit Review Modal */}
        {showSubmitModal && selectedPending && (
          <div className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4">
            <div className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg">
              <div className="flex items-center justify-between p-5 border-b border-slate-700">
                <h2 className="text-lg font-semibold text-white">Évaluer votre consultation</h2>
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <X className="w-5 h-5" />
                </button>
              </div>

              <div className="p-5 space-y-5">
                {/* Doctor info */}
                <div className="flex items-center gap-4 p-4 bg-slate-700/50 rounded-xl">
                  <div className="w-12 h-12 rounded-full bg-teal-600 flex items-center justify-center text-sm font-bold text-white">
                    {getInitials(selectedPending.doctorName)}
                  </div>
                  <div>
                    <h3 className="font-semibold text-white">{selectedPending.doctorName}</h3>
                    <p className="text-sm text-slate-400">{selectedPending.doctorSpecialty}</p>
                    <p className="text-xs text-slate-500">
                      Consultation du {formatDate(selectedPending.appointmentDate)}
                    </p>
                  </div>
                </div>

                {/* Rating */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-3">
                    Comment évaluez-vous cette consultation ?
                  </label>
                  <div className="flex justify-center">
                    <StarRating
                      rating={submitRating}
                      onRate={setSubmitRating}
                      size="lg"
                      interactive
                    />
                  </div>
                  {submitRating > 0 && (
                    <p className="text-center text-sm text-slate-400 mt-2">
                      {submitRating === 5 ? 'Excellent !' :
                       submitRating === 4 ? 'Très bien' :
                       submitRating === 3 ? 'Correct' :
                       submitRating === 2 ? 'Décevant' : 'Très décevant'}
                    </p>
                  )}
                </div>

                {/* Comment */}
                <div>
                  <label className="block text-sm font-medium text-slate-300 mb-2">
                    Votre commentaire (optionnel)
                  </label>
                  <textarea
                    value={submitComment}
                    onChange={e => setSubmitComment(e.target.value)}
                    placeholder="Partagez votre expérience..."
                    rows={4}
                    className="w-full px-4 py-3 bg-slate-700 border border-slate-600 rounded-xl text-white placeholder-slate-500 text-sm resize-none focus:outline-none focus:border-teal-500"
                  />
                </div>

                {/* Privacy toggle */}
                <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-700/50 rounded-xl">
                  <input
                    type="checkbox"
                    checked={submitIsPublic}
                    onChange={e => setSubmitIsPublic(e.target.checked)}
                    className="w-4 h-4 rounded border-slate-600 bg-slate-700 text-teal-600 focus:ring-teal-500"
                  />
                  <div>
                    <span className="text-sm text-white">Publier cet avis</span>
                    <p className="text-xs text-slate-500">Visible par les autres patients</p>
                  </div>
                </label>
              </div>

              <div className="flex gap-3 p-5 border-t border-slate-700">
                <button
                  onClick={() => setShowSubmitModal(false)}
                  className="flex-1 px-4 py-3 bg-slate-700 text-slate-300 rounded-xl font-medium hover:bg-slate-600 transition-colors"
                >
                  Annuler
                </button>
                <button
                  onClick={handleSubmitReview}
                  disabled={submitRating === 0 || submitting}
                  className="flex-1 px-4 py-3 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
                >
                  {submitting ? (
                    <>
                      <RefreshCw className="w-4 h-4 animate-spin" />
                      Envoi...
                    </>
                  ) : (
                    <>
                      <Star className="w-4 h-4" />
                      Soumettre l'avis
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
