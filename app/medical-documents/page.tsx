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
  HardDrive,
  FolderTree,
  FileStack,
  Calendar,
  Search,
  Download,
  Share2,
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

const CATEGORY_CONFIG: Record<string, { icon: React.ReactNode; color: string; bgColor: string; borderColor: string }> = {
  PRESCRIPTION: {
    icon: <Pill className="w-5 h-5" />,
    color: 'text-blue-400',
    bgColor: 'bg-blue-500/20',
    borderColor: 'border-blue-500/30',
  },
  LAB_RESULT: {
    icon: <FlaskConical className="w-5 h-5" />,
    color: 'text-purple-400',
    bgColor: 'bg-purple-500/20',
    borderColor: 'border-purple-500/30',
  },
  IMAGING: {
    icon: <Camera className="w-5 h-5" />,
    color: 'text-cyan-400',
    bgColor: 'bg-cyan-500/20',
    borderColor: 'border-cyan-500/30',
  },
  MEDICAL_REPORT: {
    icon: <ClipboardList className="w-5 h-5" />,
    color: 'text-teal-400',
    bgColor: 'bg-teal-500/20',
    borderColor: 'border-teal-500/30',
  },
  VACCINATION: {
    icon: <Syringe className="w-5 h-5" />,
    color: 'text-green-400',
    bgColor: 'bg-green-500/20',
    borderColor: 'border-green-500/30',
  },
  CERTIFICATE: {
    icon: <FileText className="w-5 h-5" />,
    color: 'text-amber-400',
    bgColor: 'bg-amber-500/20',
    borderColor: 'border-amber-500/30',
  },
  INSURANCE: {
    icon: <Shield className="w-5 h-5" />,
    color: 'text-indigo-400',
    bgColor: 'bg-indigo-500/20',
    borderColor: 'border-indigo-500/30',
  },
  OTHER: {
    icon: <FolderOpen className="w-5 h-5" />,
    color: 'text-slate-400',
    bgColor: 'bg-slate-500/20',
    borderColor: 'border-slate-500/30',
  },
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
  const [searchQuery, setSearchQuery] = useState('');
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

  const filteredDocuments = documents.filter((doc) => {
    if (selectedCategory && doc.category !== selectedCategory) return false;
    if (searchQuery) {
      const query = searchQuery.toLowerCase();
      const title = (doc.title || doc.fileName).toLowerCase();
      const desc = (doc.description || '').toLowerCase();
      if (!title.includes(query) && !desc.includes(query)) return false;
    }
    return true;
  });

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
      <div className="max-w-6xl mx-auto px-4 py-8">
        <div className="flex items-center gap-3 mb-6">
          <div className="p-2.5 bg-teal-500/10 rounded-xl">
            <FileStack className="w-6 h-6 text-teal-400" />
          </div>
          <h1 className="text-2xl font-bold text-white">Mes Documents Médicaux</h1>
        </div>
        <div className="bg-slate-800 rounded-2xl border border-slate-700 p-10 flex items-center justify-center">
          <Loader2 className="w-6 h-6 animate-spin text-teal-500 mr-3" />
          <span className="text-slate-400">Chargement de vos documents...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-6xl mx-auto px-4 py-8 space-y-6">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:justify-between sm:items-start gap-4">
        <div>
          <div className="flex items-center gap-3 mb-2">
            <div className="p-2.5 bg-teal-500/10 rounded-xl">
              <FileStack className="w-6 h-6 text-teal-400" />
            </div>
            <h1 className="text-2xl font-bold text-white">Mes Documents Médicaux</h1>
          </div>
          <p className="text-slate-400 ml-14">Gérez et consultez vos documents en toute sécurité</p>
        </div>
        <button
          onClick={() => setShowUploadModal(true)}
          className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
        >
          <Upload className="w-4 h-4" />
          Ajouter un document
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-teal-500/20 rounded-xl">
                <FileStack className="w-6 h-6 text-teal-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{stats.totalDocuments}</div>
                <div className="text-sm text-slate-400">Documents</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-green-500/20 rounded-xl">
                <HardDrive className="w-6 h-6 text-green-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{formatFileSize(stats.totalSizeBytes)}</div>
                <div className="text-sm text-slate-400">Espace utilisé</div>
              </div>
            </div>
          </div>
          <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
            <div className="flex items-center gap-4">
              <div className="p-3 bg-amber-500/20 rounded-xl">
                <FolderTree className="w-6 h-6 text-amber-400" />
              </div>
              <div>
                <div className="text-2xl font-bold text-white">{Object.keys(stats.byCategory).length}</div>
                <div className="text-sm text-slate-400">Catégories</div>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Recherche et filtres */}
      <div className="space-y-4">
        {/* Barre de recherche */}
        <div className="relative">
          <input
            type="text"
            placeholder="Rechercher un document..."
            value={searchQuery}
            onChange={(e) => setSearchQuery(e.target.value)}
            className="w-full py-3 px-4 pl-11 text-sm bg-slate-800 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 outline-none transition-all focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20"
          />
          <Search className="absolute left-4 top-1/2 -translate-y-1/2 w-[18px] h-[18px] text-slate-500" />
          {searchQuery && (
            <button
              onClick={() => setSearchQuery('')}
              className="absolute right-3 top-1/2 -translate-y-1/2 w-6 h-6 bg-slate-700 rounded-full flex items-center justify-center hover:bg-slate-600 transition-colors"
            >
              <X className="w-3 h-3 text-slate-400" />
            </button>
          )}
        </div>

        {/* Filtres par catégorie */}
        <div className="flex flex-wrap gap-2">
          <button
            onClick={() => setSelectedCategory(null)}
            className={`px-4 py-2 rounded-xl text-sm font-medium transition-all ${
              !selectedCategory
                ? 'bg-teal-600 text-white'
                : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
            }`}
          >
            Tous ({documents.length})
          </button>
          {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
            const count = documents.filter((d) => d.category === key).length;
            if (count === 0) return null;
            const config = CATEGORY_CONFIG[key];
            return (
              <button
                key={key}
                onClick={() => setSelectedCategory(key)}
                className={`inline-flex items-center gap-2 px-4 py-2 rounded-xl text-sm font-medium transition-all ${
                  selectedCategory === key
                    ? `${config.bgColor} ${config.color} border ${config.borderColor}`
                    : 'bg-slate-800 border border-slate-700 text-slate-300 hover:border-slate-600'
                }`}
              >
                {config.icon}
                {label} ({count})
              </button>
            );
          })}
        </div>
      </div>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <div className="bg-slate-800/50 rounded-2xl border-2 border-dashed border-slate-700 p-12 text-center">
          <div className="flex justify-center mb-4">
            <div className="p-4 bg-slate-800 rounded-2xl">
              {searchQuery ? (
                <Search className="w-12 h-12 text-slate-600" />
              ) : (
                <FolderOpen className="w-12 h-12 text-slate-600" />
              )}
            </div>
          </div>
          <h3 className="text-lg font-semibold text-white mb-2">
            {searchQuery ? 'Aucun résultat' : 'Aucun document'}
          </h3>
          <p className="text-slate-400 mb-6 max-w-sm mx-auto">
            {searchQuery
              ? `Aucun document ne correspond à "${searchQuery}"`
              : 'Commencez à ajouter vos documents médicaux pour les conserver en toute sécurité'}
          </p>
          {!searchQuery && (
            <button
              onClick={() => setShowUploadModal(true)}
              className="inline-flex items-center gap-2 px-5 py-2.5 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors"
            >
              <Upload className="w-4 h-4" />
              Ajouter mon premier document
            </button>
          )}
        </div>
      ) : (
        <div className="space-y-3">
          {filteredDocuments.map((doc) => {
            const config = CATEGORY_CONFIG[doc.category] || CATEGORY_CONFIG.OTHER;
            return (
              <div
                key={doc.id}
                className="bg-slate-800 rounded-xl border border-slate-700 p-4 hover:border-slate-600 transition-all"
              >
                <div className="flex flex-col sm:flex-row sm:items-center gap-4">
                  {/* Icône */}
                  <div className={`w-12 h-12 rounded-xl ${config.bgColor} flex items-center justify-center ${config.color} flex-shrink-0`}>
                    {config.icon}
                  </div>

                  {/* Info */}
                  <div className="flex-1 min-w-0">
                    <div className="font-semibold text-white truncate">
                      {doc.title || doc.fileName}
                    </div>
                    <div className="text-sm text-slate-400 mt-0.5 flex flex-wrap items-center gap-x-2 gap-y-1">
                      <span className={config.color}>{CATEGORY_LABELS[doc.category]}</span>
                      <span className="text-slate-600">•</span>
                      <span>{formatFileSize(doc.fileSize)}</span>
                      {doc.documentDate && (
                        <>
                          <span className="text-slate-600">•</span>
                          <span className="inline-flex items-center gap-1">
                            <Calendar className="w-3 h-3" />
                            {new Date(doc.documentDate).toLocaleDateString('fr-FR')}
                          </span>
                        </>
                      )}
                    </div>
                    {doc.description && (
                      <div className="text-sm text-slate-500 mt-1 truncate">
                        {doc.description}
                      </div>
                    )}
                    <div className="text-xs text-slate-500 mt-2 flex flex-wrap items-center gap-3">
                      <span>Ajouté le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}</span>
                      {doc.isPrivate && (
                        <span className="inline-flex items-center gap-1 text-amber-400 bg-amber-500/10 px-2 py-0.5 rounded-full">
                          <Lock className="w-3 h-3" /> Privé
                        </span>
                      )}
                      {doc.sharedWith.length > 0 && (
                        <span className="inline-flex items-center gap-1 text-blue-400 bg-blue-500/10 px-2 py-0.5 rounded-full">
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
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-slate-300 bg-slate-700 rounded-lg hover:bg-slate-600 hover:text-white transition-colors border border-slate-600"
                    >
                      <Eye className="w-4 h-4" />
                      <span className="hidden sm:inline">Voir</span>
                    </a>
                    <a
                      href={doc.fileUrl}
                      download
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-teal-400 bg-teal-500/10 rounded-lg hover:bg-teal-500/20 transition-colors border border-teal-500/30"
                    >
                      <Download className="w-4 h-4" />
                      <span className="hidden sm:inline">Télécharger</span>
                    </a>
                    <button
                      onClick={() => deleteDocument(doc.id)}
                      className="inline-flex items-center gap-1.5 px-3 py-2 text-sm font-medium text-red-400 bg-red-500/10 rounded-lg hover:bg-red-500/20 transition-colors border border-red-500/30"
                    >
                      <Trash2 className="w-4 h-4" />
                      <span className="hidden sm:inline">Supprimer</span>
                    </button>
                  </div>
                </div>
              </div>
            );
          })}
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
  const [error, setError] = useState('');

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!fileUrl || !fileName) {
      setError('Veuillez entrer l\'URL du fichier et un nom');
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
        setError('Erreur lors de l\'ajout du document');
      }
    } catch (err) {
      console.error('Error uploading document:', err);
      setError('Erreur lors de l\'ajout du document');
    } finally {
      setLoading(false);
    }
  };

  const selectedConfig = CATEGORY_CONFIG[category] || CATEGORY_CONFIG.OTHER;

  return (
    <div
      className="fixed inset-0 bg-black/70 backdrop-blur-sm flex items-center justify-center z-50 p-4"
      onClick={onClose}
    >
      <div
        className="bg-slate-800 rounded-2xl border border-slate-700 w-full max-w-lg max-h-[90vh] overflow-auto"
        onClick={(e) => e.stopPropagation()}
      >
        <div className="flex items-center justify-between p-5 border-b border-slate-700">
          <div className="flex items-center gap-3">
            <div className="p-2 bg-teal-500/20 rounded-lg">
              <Upload className="w-5 h-5 text-teal-400" />
            </div>
            <h2 className="text-lg font-semibold text-white">Ajouter un document</h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 text-slate-400 hover:text-white hover:bg-slate-700 rounded-lg transition-colors"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="p-5 space-y-4">
          {error && (
            <div className="p-3 bg-red-500/10 border border-red-500/30 rounded-lg text-red-400 text-sm">
              {error}
            </div>
          )}
          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              URL du fichier *
            </label>
            <input
              type="url"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
            <p className="text-xs text-slate-500 mt-1.5">
              Uploadez votre fichier sur un service cloud et collez le lien ici
            </p>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Nom du fichier *
            </label>
            <input
              type="text"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="ordonnance-2024.pdf"
              required
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Titre (optionnel)
            </label>
            <input
              type="text"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ordonnance Dr. Martin"
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Catégorie
            </label>
            <div className="relative">
              <select
                value={category}
                onChange={(e) => setCategory(e.target.value)}
                className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all appearance-none cursor-pointer"
              >
                {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                  <option key={key} value={key}>
                    {label}
                  </option>
                ))}
              </select>
              <div className={`absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none ${selectedConfig.color}`}>
                {selectedConfig.icon}
              </div>
            </div>
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Date du document
            </label>
            <input
              type="date"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all"
            />
          </div>

          <div>
            <label className="block text-sm font-medium text-slate-300 mb-1.5">
              Description (optionnel)
            </label>
            <textarea
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes supplémentaires..."
              rows={3}
              className="w-full px-4 py-2.5 bg-slate-900 border border-slate-700 rounded-xl text-white placeholder:text-slate-500 text-sm outline-none focus:border-teal-500 focus:ring-2 focus:ring-teal-500/20 transition-all resize-none"
            />
          </div>

          <label className="flex items-center gap-3 cursor-pointer p-3 bg-slate-900 rounded-xl border border-slate-700 hover:border-slate-600 transition-colors">
            <div className="relative">
              <input
                type="checkbox"
                checked={isPrivate}
                onChange={(e) => setIsPrivate(e.target.checked)}
                className="sr-only peer"
              />
              <div className="w-10 h-6 bg-slate-700 rounded-full peer-checked:bg-amber-500 transition-colors"></div>
              <div className="absolute top-1 left-1 w-4 h-4 bg-white rounded-full peer-checked:translate-x-4 transition-transform"></div>
            </div>
            <div>
              <span className="text-sm text-white font-medium">Document privé</span>
              <p className="text-xs text-slate-500">Non visible par les médecins</p>
            </div>
            <Lock className={`w-4 h-4 ml-auto ${isPrivate ? 'text-amber-400' : 'text-slate-600'}`} />
          </label>

          <div className="flex justify-end gap-3 pt-4 border-t border-slate-700">
            <button
              type="button"
              onClick={onClose}
              className="px-4 py-2.5 text-sm font-medium text-slate-300 bg-slate-700 rounded-xl hover:bg-slate-600 transition-colors"
            >
              Annuler
            </button>
            <button
              type="submit"
              disabled={loading}
              className="inline-flex items-center gap-2 px-5 py-2.5 text-sm font-medium text-white bg-teal-600 rounded-xl hover:bg-teal-500 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            >
              {loading && <Loader2 className="w-4 h-4 animate-spin" />}
              {loading ? 'Ajout en cours...' : 'Ajouter le document'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
