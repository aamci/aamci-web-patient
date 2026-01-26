'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import {
  Pill,
  FlaskConical,
  Camera,
  ClipboardList,
  Syringe,
  FileText,
  Shield,
  FolderOpen,
  X,
  Upload,
  Eye,
  Trash2,
  Lock,
  Users,
  Loader2,
} from 'lucide-react';

interface MedicalDocument {
  id: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  category: string;
  title: string | null;
  description: string | null;
  documentDate: string | null;
  doctorId: string | null;
  isPrivate: boolean;
  sharedWith: string[];
  createdAt: string;
}

interface DocumentStats {
  totalDocuments: number;
  totalSizeBytes: number;
  byCategory: Record<string, number>;
}

const CATEGORY_LABELS: Record<string, string> = {
  PRESCRIPTION: 'Ordonnance',
  LAB_RESULT: 'Résultat d\'analyse',
  IMAGING: 'Imagerie',
  MEDICAL_REPORT: 'Compte-rendu',
  VACCINATION: 'Vaccination',
  CERTIFICATE: 'Certificat',
  INSURANCE: 'Assurance',
  OTHER: 'Autre',
};

const CATEGORY_ICONS: Record<string, React.ReactNode> = {
  PRESCRIPTION: <Pill className="w-6 h-6" />,
  LAB_RESULT: <FlaskConical className="w-6 h-6" />,
  IMAGING: <Camera className="w-6 h-6" />,
  MEDICAL_REPORT: <ClipboardList className="w-6 h-6" />,
  VACCINATION: <Syringe className="w-6 h-6" />,
  CERTIFICATE: <FileText className="w-6 h-6" />,
  INSURANCE: <Shield className="w-6 h-6" />,
  OTHER: <FolderOpen className="w-6 h-6" />,
};

function getApiBase(): string {
  let base = process.env.NEXT_PUBLIC_API_BASE_URL ?? '';
  base = base.trim().replace(/^['"]|['"]$/g, '').replace(/\/+$/, '');
  try {
    return base ? new URL(base).toString().replace(/\/$/, '') : '';
  } catch {
    return '';
  }
}

function formatFileSize(bytes: number): string {
  if (bytes < 1024) return bytes + ' o';
  if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' Ko';
  return (bytes / (1024 * 1024)).toFixed(1) + ' Mo';
}

export default function MedicalDocumentsPage() {
  const router = useRouter();
  const [documents, setDocuments] = useState<MedicalDocument[]>([]);
  const [stats, setStats] = useState<DocumentStats | null>(null);
  const [loading, setLoading] = useState(true);
  const [selectedCategory, setSelectedCategory] = useState<string | null>(null);
  const [showUploadModal, setShowUploadModal] = useState(false);
  const apiBase = getApiBase();

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }

    async function fetchData() {
      try {
        const [docsRes, statsRes] = await Promise.all([
          fetch(`${apiBase}/medical-documents`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
          fetch(`${apiBase}/medical-documents/stats`, {
            headers: { Authorization: `Bearer ${token}` },
          }),
        ]);

        if (docsRes.ok) {
          const docsData = await docsRes.json();
          setDocuments(docsData);
        }

        if (statsRes.ok) {
          const statsData = await statsRes.json();
          setStats(statsData);
        }
      } catch (error) {
        console.error('Error fetching documents:', error);
      } finally {
        setLoading(false);
      }
    }

    fetchData();
  }, [apiBase, router]);

  const filteredDocuments = selectedCategory
    ? documents.filter((d) => d.category === selectedCategory)
    : documents;

  const deleteDocument = async (docId: string) => {
    if (!confirm('Êtes-vous sûr de vouloir supprimer ce document ?')) return;

    const token = localStorage.getItem('token');
    if (!token) return;

    try {
      const res = await fetch(`${apiBase}/medical-documents/${docId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });

      if (res.ok) {
        setDocuments((prev) => prev.filter((d) => d.id !== docId));
      }
    } catch (error) {
      console.error('Error deleting document:', error);
    }
  };

  if (loading) {
    return (
      <div className="max-w-6xl mx-auto px-4 py-6">
        <h1 className="text-2xl font-bold text-gray-900 mb-4">Mes Documents Médicaux</h1>
        <div className="bg-white rounded-xl border border-gray-200 p-6 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-blue-600 mr-2" />
          <span className="text-gray-600">Chargement...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-6 space-y-5">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-4">
        <h1 className="text-2xl font-bold text-gray-900">Mes Documents Médicaux</h1>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Ajouter un document
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-blue-600">{stats.totalDocuments}</div>
            <div className="text-sm text-gray-500 mt-1">Documents</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-green-600">{formatFileSize(stats.totalSizeBytes)}</div>
            <div className="text-sm text-gray-500 mt-1">Espace utilisé</div>
          </div>
          <div className="bg-white rounded-xl border border-gray-200 p-5 text-center">
            <div className="text-3xl font-bold text-amber-600">{Object.keys(stats.byCategory).length}</div>
            <div className="text-sm text-gray-500 mt-1">Catégories</div>
          </div>
        </div>
      )}

      {/* Filtres par catégorie */}
      <div className="flex flex-wrap gap-2">
        <button
          onClick={() => setSelectedCategory(null)}
          className={`px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
            !selectedCategory
              ? 'bg-blue-600 text-white'
              : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
          }`}
        >
          Tous ({documents.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count = documents.filter((d) => d.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              onClick={() => setSelectedCategory(key)}
              className={`inline-flex items-center gap-2 px-4 py-2 rounded-lg text-sm font-medium transition-colors ${
                selectedCategory === key
                  ? 'bg-blue-600 text-white'
                  : 'bg-white border border-gray-200 text-gray-700 hover:bg-gray-50'
              }`}
            >
              {CATEGORY_ICONS[key]}
              {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-white rounded-xl border border-gray-200 p-10 text-center">
          <FolderOpen className="w-12 h-12 text-gray-400 mx-auto mb-4" />
          <h3 className="text-lg font-semibold text-gray-900 mb-2">Aucun document</h3>
          <p className="text-gray-500 mb-4">
            Commencez à ajouter vos documents médicaux pour les conserver en toute sécurité
          </p>
          <button
            onClick={() => setShowUploadModal(true)}
            className="inline-flex items-center gap-2 px-4 py-2.5 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors"
          >
            <Upload className="w-4 h-4" />
            Ajouter mon premier document
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="bg-white rounded-xl border border-gray-200 p-4 flex flex-col sm:flex-row sm:items-center gap-4"
            >
              {/* Icône */}
              <div className="w-12 h-12 rounded-xl bg-gray-100 flex items-center justify-center text-gray-600 flex-shrink-0">
                {CATEGORY_ICONS[doc.category] || <FolderOpen className="w-6 h-6" />}
              </div>

              {/* Info */}
              <div className="flex-1 min-w-0">
                <div className="font-semibold text-gray-900 truncate">
                  {doc.title || doc.fileName}
                </div>
                <div className="text-sm text-gray-500 mt-0.5">
                  {CATEGORY_LABELS[doc.category]} • {formatFileSize(doc.fileSize)}
                  {doc.documentDate && (
                    <> • {new Date(doc.documentDate).toLocaleDateString('fr-FR')}</>
                  )}
                </div>
                {doc.description && (
                  <div className="text-sm text-gray-400 mt-1 truncate">
                    {doc.description}
                  </div>
                )}
                <div className="text-xs text-gray-400 mt-1 flex flex-wrap items-center gap-2">
                  <span>Ajouté le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                  {doc.isPrivate && (
                    <span className="inline-flex items-center gap-1 text-amber-600">
                      <Lock className="w-3 h-3" /> Privé
                    </span>
                  )}
                  {doc.sharedWith.length > 0 && (
                    <span className="inline-flex items-center gap-1 text-blue-600">
                      <Users className="w-3 h-3" /> Partagé ({doc.sharedWith.length})
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div className="flex items-center gap-2 flex-shrink-0">
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
                >
                  <Eye className="w-4 h-4" />
                  Voir
                </a>
                <button
                  onClick={() => deleteDocument(doc.id)}
                  className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-600 bg-red-50 rounded-lg hover:bg-red-100 transition-colors"
                >
                  <Trash2 className="w-4 h-4" />
                  Supprimer
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal d'upload */}
      {showUploadModal && (
        <UploadModal
          onClose={() => setShowUploadModal(false)}
          onSuccess={(newDoc) => {
            setDocuments((prev) => [newDoc, ...prev]);
            setShowUploadModal(false);
          }}
          apiBase={apiBase}
        />
      )}
    </div>
  );
}

function UploadModal({
  onClose,
  onSuccess,
  apiBase,
}: {
  onClose: () => void;
  onSuccess: (doc: MedicalDocument) => void;
  apiBase: string;
}) {
  const [title, setTitle] = useState('');
  const [description, setDescription] = useState('');
  const [category, setCategory] = useState('OTHER');
  const [documentDate, setDocumentDate] = useState('');
  const [isPrivate, setIsPrivate] = useState(false);
  const [fileUrl, setFileUrl] = useState('');
  const [fileName, setFileName] = useState('');
  const [fileType, setFileType] = useState('');
  const [fileSize, setFileSize] = useState(0);
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!fileUrl || !fileName) {
      alert('Veuillez entrer l\'URL du fichier');
      return;
    }

    const token = localStorage.getItem('token');
    if (!token) return;

    setLoading(true);
    try {
      const res = await fetch(`${apiBase}/medical-documents`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          fileName,
          fileUrl,
          fileType: fileType || 'application/octet-stream',
          fileSize: fileSize || 0,
          category,
          title: title || null,
          description: description || null,
          documentDate: documentDate || null,
          isPrivate,
        }),
      });

      if (res.ok) {
        const newDoc = await res.json();
        onSuccess(newDoc);
      } else {
        alert('Erreur lors de l\'ajout du document');
      }
    } catch (error) {
      console.error('Error uploading document:', error);
      alert('Erreur lors de l\'ajout du document');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div
      className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-white rounded-2xl w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-gray-200">
          <h2 className="text-lg font-semibold text-gray-900">Ajouter un document</h2>
          <button
            onClick={onClose}
            className="p-2 text-gray-400 hover:text-gray-600 hover:bg-gray-100 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              URL du fichier *
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
            />
            <p className="text-xs text-gray-500 mt-1">
              Uploadez votre fichier sur un service cloud et collez le lien ici
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Nom du fichier *
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="ordonnance-2024.pdf"
              required
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ordonnance Dr. Martin"
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Catégorie
            </label>
            <select
              value={category}
              onChange={(e) => setCategory(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors bg-white"
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Date du document
            </label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1.5">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes supplémentaires..."
              rows={3}
              className="w-full px-4 py-2.5 border border-gray-200 rounded-lg text-sm outline-none focus:border-blue-500 focus:ring-2 focus:ring-blue-500/10 transition-colors resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer">
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
              className="w-4 h-4 text-blue-600 border-gray-300 rounded focus:ring-blue-500"
            />
            <span className="text-sm text-gray-700">Document privé (non visible par les médecins)</span>
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-gray-200">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-gray-700 bg-gray-100 rounded-lg hover:bg-gray-200 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-4 py-2.5 text-sm font-medium text-white bg-blue-600 rounded-lg hover:bg-blue-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
