'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';

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

const CATEGORY_ICONS: Record<string, string> = {
  PRESCRIPTION: '💊',
  LAB_RESULT: '🔬',
  IMAGING: '📷',
  MEDICAL_REPORT: '📋',
  VACCINATION: '💉',
  CERTIFICATE: '📜',
  INSURANCE: '🛡️',
  OTHER: '📁',
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
      <div style={{ padding: '24px 0' }}>
        <h1>Mes Documents Médicaux</h1>
        <div className="card" style={{ marginTop: 16 }}>Chargement...</div>
      </div>
    );
  }

  return (
    <div style={{ padding: '24px 0', display: 'grid', gap: 20 }}>
      {/* Header */}
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <h1 style={{ margin: 0 }}>Mes Documents Médicaux</h1>
        <button
          className="btn primary"
          onClick={() => setShowUploadModal(true)}
        >
          + Ajouter un document
        </button>
      </div>

      {/* Statistiques */}
      {stats && (
        <div
          style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))',
            gap: 12,
          }}
        >
          <div className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#3b82f6' }}>
              {stats.totalDocuments}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Documents</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#10b981' }}>
              {formatFileSize(stats.totalSizeBytes)}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Espace utilisé</div>
          </div>
          <div className="card" style={{ textAlign: 'center', padding: 16 }}>
            <div style={{ fontSize: 32, fontWeight: 700, color: '#f59e0b' }}>
              {Object.keys(stats.byCategory).length}
            </div>
            <div style={{ fontSize: 13, color: '#6b7280' }}>Catégories</div>
          </div>
        </div>
      )}

      {/* Filtres par catégorie */}
      <div style={{ display: 'flex', gap: 8, flexWrap: 'wrap' }}>
        <button
          className={`btn ${!selectedCategory ? 'primary' : 'outline'}`}
          onClick={() => setSelectedCategory(null)}
        >
          Tous ({documents.length})
        </button>
        {Object.entries(CATEGORY_LABELS).map(([key, label]) => {
          const count = documents.filter((d) => d.category === key).length;
          if (count === 0) return null;
          return (
            <button
              key={key}
              className={`btn ${selectedCategory === key ? 'primary' : 'outline'}`}
              onClick={() => setSelectedCategory(key)}
            >
              {CATEGORY_ICONS[key]} {label} ({count})
            </button>
          );
        })}
      </div>

      {/* Liste des documents */}
      {filteredDocuments.length === 0 ? (
        <div className="card" style={{ textAlign: 'center', padding: 40 }}>
          <div style={{ fontSize: 48, marginBottom: 16 }}>📂</div>
          <h3 style={{ margin: 0, marginBottom: 8 }}>Aucun document</h3>
          <p style={{ color: '#6b7280', margin: 0, marginBottom: 16 }}>
            Commencez à ajouter vos documents médicaux pour les conserver en toute sécurité
          </p>
          <button className="btn primary" onClick={() => setShowUploadModal(true)}>
            Ajouter mon premier document
          </button>
        </div>
      ) : (
        <div style={{ display: 'grid', gap: 12 }}>
          {filteredDocuments.map((doc) => (
            <div
              key={doc.id}
              className="card"
              style={{
                display: 'grid',
                gridTemplateColumns: '50px 1fr auto',
                gap: 16,
                alignItems: 'center',
                padding: '16px 20px',
              }}
            >
              {/* Icône */}
              <div
                style={{
                  width: 50,
                  height: 50,
                  borderRadius: 8,
                  background: '#f3f4f6',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  fontSize: 24,
                }}
              >
                {CATEGORY_ICONS[doc.category] || '📁'}
              </div>

              {/* Info */}
              <div>
                <div style={{ fontWeight: 600 }}>
                  {doc.title || doc.fileName}
                </div>
                <div style={{ fontSize: 13, color: '#6b7280', marginTop: 2 }}>
                  {CATEGORY_LABELS[doc.category]} • {formatFileSize(doc.fileSize)}
                  {doc.documentDate && (
                    <> • {new Date(doc.documentDate).toLocaleDateString('fr-FR')}</>
                  )}
                </div>
                {doc.description && (
                  <div style={{ fontSize: 13, color: '#9ca3af', marginTop: 4 }}>
                    {doc.description}
                  </div>
                )}
                <div style={{ fontSize: 12, color: '#9ca3af', marginTop: 4 }}>
                  Ajouté le {new Date(doc.createdAt).toLocaleDateString('fr-FR')}
                  {doc.isPrivate && (
                    <span style={{ marginLeft: 8, color: '#f59e0b' }}>🔒 Privé</span>
                  )}
                  {doc.sharedWith.length > 0 && (
                    <span style={{ marginLeft: 8, color: '#3b82f6' }}>
                      👥 Partagé ({doc.sharedWith.length})
                    </span>
                  )}
                </div>
              </div>

              {/* Actions */}
              <div style={{ display: 'flex', gap: 8 }}>
                <a
                  href={doc.fileUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="btn outline"
                  style={{ fontSize: 12, padding: '6px 12px' }}
                >
                  Voir
                </a>
                <button
                  className="btn outline"
                  style={{ fontSize: 12, padding: '6px 12px', color: '#ef4444' }}
                  onClick={() => deleteDocument(doc.id)}
                >
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
      style={{
        position: 'fixed',
        inset: 0,
        background: 'rgba(0,0,0,0.5)',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        zIndex: 100,
      }}
      onClick={onClose}
    >
      <div
        className="card"
        style={{
          width: '100%',
          maxWidth: 500,
          maxHeight: '90vh',
          overflow: 'auto',
          padding: 24,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <h2 style={{ margin: 0, marginBottom: 20 }}>Ajouter un document</h2>

        <form onSubmit={handleSubmit} style={{ display: 'grid', gap: 16 }}>
          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              URL du fichier *
            </label>
            <input
              type="url"
              className="input"
              value={fileUrl}
              onChange={(e) => setFileUrl(e.target.value)}
              placeholder="https://example.com/document.pdf"
              required
            />
            <small style={{ color: '#6b7280' }}>
              Uploadez votre fichier sur un service cloud et collez le lien ici
            </small>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Nom du fichier *
            </label>
            <input
              type="text"
              className="input"
              value={fileName}
              onChange={(e) => setFileName(e.target.value)}
              placeholder="ordonnance-2024.pdf"
              required
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Titre (optionnel)
            </label>
            <input
              type="text"
              className="input"
              value={title}
              onChange={(e) => setTitle(e.target.value)}
              placeholder="Ordonnance Dr. Martin"
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Catégorie
            </label>
            <select
              className="input"
              value={category}
              onChange={(e) => setCategory(e.target.value)}
            >
              {Object.entries(CATEGORY_LABELS).map(([key, label]) => (
                <option key={key} value={key}>
                  {label}
                </option>
              ))}
            </select>
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Date du document
            </label>
            <input
              type="date"
              className="input"
              value={documentDate}
              onChange={(e) => setDocumentDate(e.target.value)}
            />
          </div>

          <div>
            <label style={{ display: 'block', fontSize: 13, marginBottom: 4 }}>
              Description (optionnel)
            </label>
            <textarea
              className="input"
              value={description}
              onChange={(e) => setDescription(e.target.value)}
              placeholder="Notes supplémentaires..."
              rows={3}
            />
          </div>

          <label style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
            <input
              type="checkbox"
              checked={isPrivate}
              onChange={(e) => setIsPrivate(e.target.checked)}
            />
            <span>Document privé (non visible par les médecins)</span>
          </label>

          <div style={{ display: 'flex', gap: 8, justifyContent: 'flex-end', marginTop: 8 }}>
            <button type="button" className="btn outline" onClick={onClose}>
              Annuler
            </button>
            <button type="submit" className="btn primary" disabled={loading}>
              {loading ? 'Ajout...' : 'Ajouter'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
}
