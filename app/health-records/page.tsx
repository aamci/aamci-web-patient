'use client';

import { useState, useEffect, useCallback } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import {
  Heart,
  Activity,
  Pill,
  FlaskConical,
  Syringe,
  AlertTriangle,
  Calendar,
  Clock,
  ChevronRight,
  Download,
  FileText,
  User,
  Thermometer,
  Droplets,
  Scale,
  Ruler,
  TrendingUp,
  TrendingDown,
  Minus,
  RefreshCw,
  Plus,
  Eye,
  ArrowLeft,
} from 'lucide-react';

interface HealthRecord {
  id: string;
  type: 'consultation' | 'prescription' | 'lab_result' | 'vaccination' | 'vitals';
  title: string;
  date: string;
  doctor?: string;
  specialty?: string;
  summary?: string;
  status?: 'normal' | 'warning' | 'critical';
}

interface Prescription {
  id: string;
  medication: string;
  dosage: string;
  frequency: string;
  startDate: string;
  endDate?: string;
  doctor: string;
  status: 'active' | 'completed' | 'cancelled';
  refillsRemaining?: number;
}

interface LabResult {
  id: string;
  testName: string;
  value: string;
  unit: string;
  referenceRange: string;
  status: 'normal' | 'low' | 'high' | 'critical';
  date: string;
  trend?: 'up' | 'down' | 'stable';
}

interface Vaccination {
  id: string;
  name: string;
  date: string;
  nextDose?: string;
  doctor: string;
  batchNumber?: string;
}

interface Allergy {
  id: string;
  allergen: string;
  severity: 'mild' | 'moderate' | 'severe';
  reaction: string;
  diagnosedDate: string;
}

interface VitalSigns {
  bloodPressure: string;
  heartRate: number;
  temperature: number;
  weight: number;
  height: number;
  bmi: number;
  lastUpdated: string;
}

export default function HealthRecordsPage() {
  const router = useRouter();
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<'overview' | 'prescriptions' | 'labs' | 'vaccinations' | 'timeline'>('overview');
  const [exporting, setExporting] = useState(false);

  // Mock data states
  const [vitals, setVitals] = useState<VitalSigns | null>(null);
  const [prescriptions, setPrescriptions] = useState<Prescription[]>([]);
  const [labResults, setLabResults] = useState<LabResult[]>([]);
  const [vaccinations, setVaccinations] = useState<Vaccination[]>([]);
  const [allergies, setAllergies] = useState<Allergy[]>([]);
  const [timeline, setTimeline] = useState<HealthRecord[]>([]);

  const apiBaseUrl = process.env.NEXT_PUBLIC_API_BASE_URL || 'http://localhost:3000';

  const loadMockData = useCallback(() => {
    // Mock vitals
    setVitals({
      bloodPressure: '120/80',
      heartRate: 72,
      temperature: 36.6,
      weight: 70,
      height: 175,
      bmi: 22.9,
      lastUpdated: new Date(Date.now() - 1000 * 60 * 60 * 24 * 7).toISOString(),
    });

    // Mock prescriptions
    setPrescriptions([
      {
        id: '1',
        medication: 'Paracétamol 1000mg',
        dosage: '1 comprimé',
        frequency: '3 fois par jour',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        endDate: new Date(Date.now() + 1000 * 60 * 60 * 24 * 5).toISOString(),
        doctor: 'Dr. Martin',
        status: 'active',
        refillsRemaining: 2,
      },
      {
        id: '2',
        medication: 'Oméprazole 20mg',
        dosage: '1 gélule',
        frequency: 'Le matin à jeun',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        doctor: 'Dr. Dubois',
        status: 'active',
        refillsRemaining: 5,
      },
      {
        id: '3',
        medication: 'Amoxicilline 500mg',
        dosage: '1 comprimé',
        frequency: '2 fois par jour',
        startDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 20).toISOString(),
        endDate: new Date(Date.now() - 1000 * 60 * 60 * 24 * 13).toISOString(),
        doctor: 'Dr. Martin',
        status: 'completed',
      },
    ]);

    // Mock lab results
    setLabResults([
      {
        id: '1',
        testName: 'Glycémie à jeun',
        value: '0.95',
        unit: 'g/L',
        referenceRange: '0.70 - 1.10',
        status: 'normal',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        trend: 'stable',
      },
      {
        id: '2',
        testName: 'Cholestérol total',
        value: '2.35',
        unit: 'g/L',
        referenceRange: '< 2.00',
        status: 'high',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        trend: 'up',
      },
      {
        id: '3',
        testName: 'Hémoglobine',
        value: '14.2',
        unit: 'g/dL',
        referenceRange: '12.0 - 16.0',
        status: 'normal',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        trend: 'stable',
      },
      {
        id: '4',
        testName: 'Créatinine',
        value: '85',
        unit: 'µmol/L',
        referenceRange: '60 - 110',
        status: 'normal',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        trend: 'down',
      },
      {
        id: '5',
        testName: 'TSH',
        value: '2.1',
        unit: 'mUI/L',
        referenceRange: '0.4 - 4.0',
        status: 'normal',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        trend: 'stable',
      },
    ]);

    // Mock vaccinations
    setVaccinations([
      {
        id: '1',
        name: 'COVID-19 (Pfizer)',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 180).toISOString(),
        nextDose: new Date(Date.now() + 1000 * 60 * 60 * 24 * 180).toISOString(),
        doctor: 'Dr. Lambert',
        batchNumber: 'EL0140',
      },
      {
        id: '2',
        name: 'Grippe saisonnière',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        doctor: 'Dr. Martin',
        batchNumber: 'FL2023-01',
      },
      {
        id: '3',
        name: 'Tétanos (rappel)',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 365 * 2).toISOString(),
        nextDose: new Date(Date.now() + 1000 * 60 * 60 * 24 * 365 * 8).toISOString(),
        doctor: 'Dr. Dubois',
      },
    ]);

    // Mock allergies
    setAllergies([
      {
        id: '1',
        allergen: 'Pénicilline',
        severity: 'severe',
        reaction: 'Éruption cutanée, difficulté respiratoire',
        diagnosedDate: '2015-03-15',
      },
      {
        id: '2',
        allergen: 'Arachides',
        severity: 'moderate',
        reaction: 'Urticaire',
        diagnosedDate: '2010-06-20',
      },
    ]);

    // Mock timeline
    setTimeline([
      {
        id: '1',
        type: 'consultation',
        title: 'Consultation générale',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        doctor: 'Dr. Martin',
        specialty: 'Médecine générale',
        summary: 'Bilan de santé annuel. Tout est normal.',
      },
      {
        id: '2',
        type: 'lab_result',
        title: 'Bilan sanguin complet',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 14).toISOString(),
        summary: '5 analyses effectuées',
        status: 'warning',
      },
      {
        id: '3',
        type: 'prescription',
        title: 'Nouvelle ordonnance',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 5).toISOString(),
        doctor: 'Dr. Martin',
        summary: 'Paracétamol 1000mg',
      },
      {
        id: '4',
        type: 'vaccination',
        title: 'Vaccination grippe',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 90).toISOString(),
        doctor: 'Dr. Martin',
      },
      {
        id: '5',
        type: 'consultation',
        title: 'Consultation gastro-entérologie',
        date: new Date(Date.now() - 1000 * 60 * 60 * 24 * 30).toISOString(),
        doctor: 'Dr. Dubois',
        specialty: 'Gastro-entérologie',
        summary: 'Suivi reflux gastrique',
      },
    ]);

    setLoading(false);
  }, []);

  useEffect(() => {
    const token = localStorage.getItem('token');
    if (!token) {
      router.push('/auth/login');
      return;
    }
    loadMockData();
  }, [router, loadMockData]);

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'normal': return 'text-green-400 bg-green-500/20';
      case 'low': return 'text-blue-400 bg-blue-500/20';
      case 'high': return 'text-orange-400 bg-orange-500/20';
      case 'critical': return 'text-red-400 bg-red-500/20';
      case 'warning': return 'text-amber-400 bg-amber-500/20';
      default: return 'text-slate-400 bg-slate-500/20';
    }
  };

  const getSeverityColor = (severity: string) => {
    switch (severity) {
      case 'mild': return 'text-yellow-400 bg-yellow-500/20 border-yellow-500/30';
      case 'moderate': return 'text-orange-400 bg-orange-500/20 border-orange-500/30';
      case 'severe': return 'text-red-400 bg-red-500/20 border-red-500/30';
      default: return 'text-slate-400 bg-slate-500/20 border-slate-500/30';
    }
  };

  const getTrendIcon = (trend?: string) => {
    switch (trend) {
      case 'up': return <TrendingUp className="w-4 h-4 text-red-400" />;
      case 'down': return <TrendingDown className="w-4 h-4 text-blue-400" />;
      default: return <Minus className="w-4 h-4 text-slate-400" />;
    }
  };

  const formatDate = (dateString: string) => {
    return new Date(dateString).toLocaleDateString('fr-FR', {
      day: 'numeric',
      month: 'long',
      year: 'numeric',
    });
  };

  const exportToPDF = async () => {
    setExporting(true);

    // Generate HTML content for PDF
    const htmlContent = `
<!DOCTYPE html>
<html lang="fr">
<head>
  <meta charset="UTF-8">
  <title>Dossier Médical - Export</title>
  <style>
    body { font-family: Arial, sans-serif; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    h1 { color: #0d9488; border-bottom: 2px solid #0d9488; padding-bottom: 10px; }
    h2 { color: #1f2937; margin-top: 30px; border-bottom: 1px solid #e5e7eb; padding-bottom: 5px; }
    .section { margin-bottom: 30px; }
    .card { background: #f9fafb; border: 1px solid #e5e7eb; border-radius: 8px; padding: 15px; margin: 10px 0; }
    .alert { background: #fef2f2; border: 1px solid #fecaca; color: #b91c1c; padding: 10px; border-radius: 8px; }
    .grid { display: grid; grid-template-columns: repeat(3, 1fr); gap: 10px; }
    .vital { text-align: center; padding: 15px; background: #f3f4f6; border-radius: 8px; }
    .vital-value { font-size: 24px; font-weight: bold; color: #0d9488; }
    .vital-label { font-size: 12px; color: #6b7280; }
    table { width: 100%; border-collapse: collapse; margin-top: 10px; }
    th, td { padding: 10px; text-align: left; border-bottom: 1px solid #e5e7eb; }
    th { background: #f3f4f6; font-weight: 600; }
    .status-normal { color: #059669; }
    .status-high { color: #d97706; }
    .status-low { color: #3b82f6; }
    .footer { margin-top: 40px; padding-top: 20px; border-top: 1px solid #e5e7eb; font-size: 12px; color: #6b7280; text-align: center; }
  </style>
</head>
<body>
  <h1>Dossier Médical</h1>
  <p>Exporté le ${new Date().toLocaleDateString('fr-FR', { day: 'numeric', month: 'long', year: 'numeric', hour: '2-digit', minute: '2-digit' })}</p>

  ${allergies.length > 0 ? `
  <div class="alert">
    <strong>⚠️ Allergies connues:</strong> ${allergies.map(a => `${a.allergen} (${a.severity === 'severe' ? 'Sévère' : a.severity === 'moderate' ? 'Modéré' : 'Léger'})`).join(', ')}
  </div>
  ` : ''}

  ${vitals ? `
  <div class="section">
    <h2>Constantes Vitales</h2>
    <p style="font-size: 12px; color: #6b7280;">Dernière mise à jour: ${formatDate(vitals.lastUpdated)}</p>
    <div class="grid">
      <div class="vital"><div class="vital-value">${vitals.bloodPressure}</div><div class="vital-label">Tension</div></div>
      <div class="vital"><div class="vital-value">${vitals.heartRate}</div><div class="vital-label">Pouls (bpm)</div></div>
      <div class="vital"><div class="vital-value">${vitals.temperature}°C</div><div class="vital-label">Température</div></div>
      <div class="vital"><div class="vital-value">${vitals.weight} kg</div><div class="vital-label">Poids</div></div>
      <div class="vital"><div class="vital-value">${vitals.height} cm</div><div class="vital-label">Taille</div></div>
      <div class="vital"><div class="vital-value">${vitals.bmi}</div><div class="vital-label">IMC</div></div>
    </div>
  </div>
  ` : ''}

  <div class="section">
    <h2>Ordonnances Actives</h2>
    ${prescriptions.filter(p => p.status === 'active').map(p => `
    <div class="card">
      <strong>${p.medication}</strong><br>
      <span style="color: #6b7280;">${p.dosage} • ${p.frequency}</span><br>
      <span style="font-size: 12px;">Prescrit par ${p.doctor} le ${formatDate(p.startDate)}</span>
    </div>
    `).join('') || '<p style="color: #6b7280;">Aucune ordonnance active</p>'}
  </div>

  <div class="section">
    <h2>Résultats d'Analyses</h2>
    <table>
      <thead>
        <tr><th>Analyse</th><th>Résultat</th><th>Référence</th><th>Statut</th></tr>
      </thead>
      <tbody>
        ${labResults.map(r => `
        <tr>
          <td>${r.testName}</td>
          <td><strong>${r.value}</strong> ${r.unit}</td>
          <td>${r.referenceRange}</td>
          <td class="status-${r.status}">${r.status === 'normal' ? 'Normal' : r.status === 'high' ? 'Élevé' : r.status === 'low' ? 'Bas' : 'Critique'}</td>
        </tr>
        `).join('')}
      </tbody>
    </table>
  </div>

  <div class="section">
    <h2>Carnet de Vaccination</h2>
    ${vaccinations.map(v => `
    <div class="card">
      <strong>${v.name}</strong><br>
      <span style="font-size: 12px;">Administré le ${formatDate(v.date)} par ${v.doctor}</span>
      ${v.nextDose ? `<br><span style="font-size: 12px; color: #0d9488;">Prochain rappel: ${formatDate(v.nextDose)}</span>` : ''}
    </div>
    `).join('')}
  </div>

  <div class="footer">
    <p>Document généré automatiquement - Plateforme Santé</p>
    <p>Ce document est fourni à titre informatif uniquement.</p>
  </div>
</body>
</html>
    `;

    // Create blob and download
    const blob = new Blob([htmlContent], { type: 'text/html' });
    const url = URL.createObjectURL(blob);
    const link = document.createElement('a');
    link.href = url;
    link.download = `dossier-medical-${new Date().toISOString().split('T')[0]}.html`;
    document.body.appendChild(link);
    link.click();
    document.body.removeChild(link);
    URL.revokeObjectURL(url);

    // Simulate delay for UX
    await new Promise(resolve => setTimeout(resolve, 500));
    setExporting(false);
  };

  const tabs = [
    { id: 'overview' as const, label: 'Vue d\'ensemble', icon: Heart },
    { id: 'prescriptions' as const, label: 'Ordonnances', icon: Pill },
    { id: 'labs' as const, label: 'Analyses', icon: FlaskConical },
    { id: 'vaccinations' as const, label: 'Vaccinations', icon: Syringe },
    { id: 'timeline' as const, label: 'Historique', icon: Clock },
  ];

  if (loading) {
    return (
      <div className="min-h-screen bg-slate-900 flex items-center justify-center">
        <div className="flex flex-col items-center gap-3">
          <RefreshCw className="w-8 h-8 text-teal-500 animate-spin" />
          <p className="text-slate-400">Chargement du dossier médical...</p>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-900 pb-8">
      <div className="max-w-6xl mx-auto px-4 py-6">
        {/* Header */}
        <div className="flex items-center justify-between mb-6">
          <div className="flex items-center gap-4">
            <button
              onClick={() => router.back()}
              className="p-2 rounded-lg hover:bg-slate-800 transition-colors"
            >
              <ArrowLeft className="w-5 h-5 text-slate-400" />
            </button>
            <div>
              <h1 className="text-2xl font-bold text-white flex items-center gap-3">
                <Heart className="w-7 h-7 text-teal-500" />
                Mon Dossier Médical
              </h1>
              <p className="text-slate-400 text-sm">Consultez votre historique de santé complet</p>
            </div>
          </div>
          <button
            onClick={exportToPDF}
            disabled={exporting}
            className="flex items-center gap-2 px-4 py-2 bg-teal-600 text-white rounded-xl font-medium hover:bg-teal-500 transition-colors disabled:opacity-50"
          >
            {exporting ? (
              <RefreshCw className="w-4 h-4 animate-spin" />
            ) : (
              <Download className="w-4 h-4" />
            )}
            {exporting ? 'Export...' : 'Exporter PDF'}
          </button>
        </div>

        {/* Tabs */}
        <div className="flex gap-1 mb-6 overflow-x-auto pb-2">
          {tabs.map(tab => (
            <button
              key={tab.id}
              onClick={() => setActiveTab(tab.id)}
              className={`flex items-center gap-2 px-4 py-2.5 rounded-xl text-sm font-medium whitespace-nowrap transition-colors ${
                activeTab === tab.id
                  ? 'bg-teal-600 text-white'
                  : 'bg-slate-800 text-slate-400 hover:text-white hover:bg-slate-700'
              }`}
            >
              <tab.icon className="w-4 h-4" />
              {tab.label}
            </button>
          ))}
        </div>

        {/* Overview Tab */}
        {activeTab === 'overview' && (
          <div className="space-y-6">
            {/* Allergies Alert */}
            {allergies.length > 0 && (
              <div className="bg-red-500/10 border border-red-500/30 rounded-xl p-4">
                <h3 className="font-semibold text-red-400 flex items-center gap-2 mb-3">
                  <AlertTriangle className="w-5 h-5" />
                  Allergies connues
                </h3>
                <div className="flex flex-wrap gap-2">
                  {allergies.map(allergy => (
                    <span
                      key={allergy.id}
                      className={`px-3 py-1.5 rounded-full text-sm font-medium border ${getSeverityColor(allergy.severity)}`}
                    >
                      {allergy.allergen} ({allergy.severity === 'severe' ? 'Sévère' : allergy.severity === 'moderate' ? 'Modéré' : 'Léger'})
                    </span>
                  ))}
                </div>
              </div>
            )}

            {/* Vitals */}
            {vitals && (
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-5">
                <div className="flex items-center justify-between mb-4">
                  <h3 className="font-semibold text-white flex items-center gap-2">
                    <Activity className="w-5 h-5 text-teal-500" />
                    Constantes vitales
                  </h3>
                  <span className="text-xs text-slate-500">
                    Mis à jour le {formatDate(vitals.lastUpdated)}
                  </span>
                </div>
                <div className="grid grid-cols-2 md:grid-cols-3 lg:grid-cols-6 gap-4">
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <Droplets className="w-6 h-6 text-red-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{vitals.bloodPressure}</div>
                    <div className="text-xs text-slate-400">Tension</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <Heart className="w-6 h-6 text-pink-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{vitals.heartRate}</div>
                    <div className="text-xs text-slate-400">Pouls (bpm)</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <Thermometer className="w-6 h-6 text-orange-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{vitals.temperature}°C</div>
                    <div className="text-xs text-slate-400">Température</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <Scale className="w-6 h-6 text-blue-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{vitals.weight} kg</div>
                    <div className="text-xs text-slate-400">Poids</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <Ruler className="w-6 h-6 text-green-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{vitals.height} cm</div>
                    <div className="text-xs text-slate-400">Taille</div>
                  </div>
                  <div className="bg-slate-700/50 rounded-xl p-4 text-center">
                    <User className="w-6 h-6 text-purple-400 mx-auto mb-2" />
                    <div className="text-xl font-bold text-white">{vitals.bmi}</div>
                    <div className="text-xs text-slate-400">IMC</div>
                  </div>
                </div>
              </div>
            )}

            {/* Quick Stats */}
            <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <Pill className="w-6 h-6 text-blue-400 mb-2" />
                <div className="text-2xl font-bold text-white">
                  {prescriptions.filter(p => p.status === 'active').length}
                </div>
                <div className="text-sm text-slate-400">Ordonnances actives</div>
              </div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <FlaskConical className="w-6 h-6 text-purple-400 mb-2" />
                <div className="text-2xl font-bold text-white">{labResults.length}</div>
                <div className="text-sm text-slate-400">Analyses récentes</div>
              </div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <Syringe className="w-6 h-6 text-green-400 mb-2" />
                <div className="text-2xl font-bold text-white">{vaccinations.length}</div>
                <div className="text-sm text-slate-400">Vaccinations</div>
              </div>
              <div className="bg-slate-800 rounded-xl border border-slate-700 p-4">
                <Calendar className="w-6 h-6 text-teal-400 mb-2" />
                <div className="text-2xl font-bold text-white">{timeline.length}</div>
                <div className="text-sm text-slate-400">Événements santé</div>
              </div>
            </div>

            {/* Recent Activity */}
            <div className="bg-slate-800 rounded-xl border border-slate-700">
              <div className="p-4 border-b border-slate-700 flex items-center justify-between">
                <h3 className="font-semibold text-white">Activité récente</h3>
                <button
                  onClick={() => setActiveTab('timeline')}
                  className="text-sm text-teal-400 hover:text-teal-300 flex items-center gap-1"
                >
                  Voir tout
                  <ChevronRight className="w-4 h-4" />
                </button>
              </div>
              <div className="divide-y divide-slate-700">
                {timeline.slice(0, 3).map(event => (
                  <div key={event.id} className="p-4 flex items-center gap-4">
                    <div className={`w-10 h-10 rounded-full flex items-center justify-center ${
                      event.type === 'consultation' ? 'bg-teal-500/20 text-teal-400' :
                      event.type === 'prescription' ? 'bg-blue-500/20 text-blue-400' :
                      event.type === 'lab_result' ? 'bg-purple-500/20 text-purple-400' :
                      'bg-green-500/20 text-green-400'
                    }`}>
                      {event.type === 'consultation' && <User className="w-5 h-5" />}
                      {event.type === 'prescription' && <Pill className="w-5 h-5" />}
                      {event.type === 'lab_result' && <FlaskConical className="w-5 h-5" />}
                      {event.type === 'vaccination' && <Syringe className="w-5 h-5" />}
                    </div>
                    <div className="flex-1">
                      <div className="font-medium text-white">{event.title}</div>
                      <div className="text-sm text-slate-400">
                        {event.doctor && `${event.doctor} • `}
                        {formatDate(event.date)}
                      </div>
                    </div>
                    {event.status && (
                      <span className={`px-2 py-1 rounded-full text-xs ${getStatusColor(event.status)}`}>
                        {event.status === 'warning' ? 'À surveiller' : event.status}
                      </span>
                    )}
                  </div>
                ))}
              </div>
            </div>

            {/* Link to documents */}
            <Link
              href="/medical-documents"
              className="block bg-slate-800 rounded-xl border border-slate-700 p-5 hover:border-teal-500/50 transition-colors"
            >
              <div className="flex items-center gap-4">
                <div className="p-3 bg-teal-500/20 rounded-xl">
                  <FileText className="w-6 h-6 text-teal-400" />
                </div>
                <div className="flex-1">
                  <h3 className="font-semibold text-white">Mes documents médicaux</h3>
                  <p className="text-sm text-slate-400">Ordonnances, résultats, certificats...</p>
                </div>
                <ChevronRight className="w-5 h-5 text-slate-400" />
              </div>
            </Link>
          </div>
        )}

        {/* Prescriptions Tab */}
        {activeTab === 'prescriptions' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">
                Mes ordonnances ({prescriptions.filter(p => p.status === 'active').length} actives)
              </h2>
            </div>

            {prescriptions.map(prescription => (
              <div
                key={prescription.id}
                className={`bg-slate-800 rounded-xl border p-5 ${
                  prescription.status === 'active' ? 'border-teal-500/50' : 'border-slate-700'
                }`}
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4">
                    <div className={`p-3 rounded-xl ${
                      prescription.status === 'active' ? 'bg-teal-500/20' : 'bg-slate-700'
                    }`}>
                      <Pill className={`w-6 h-6 ${
                        prescription.status === 'active' ? 'text-teal-400' : 'text-slate-400'
                      }`} />
                    </div>
                    <div>
                      <h3 className="font-semibold text-white">{prescription.medication}</h3>
                      <p className="text-sm text-slate-400 mt-1">
                        {prescription.dosage} • {prescription.frequency}
                      </p>
                      <p className="text-sm text-slate-500 mt-2">
                        Prescrit par {prescription.doctor} le {formatDate(prescription.startDate)}
                      </p>
                      {prescription.endDate && (
                        <p className="text-sm text-slate-500">
                          Jusqu'au {formatDate(prescription.endDate)}
                        </p>
                      )}
                    </div>
                  </div>
                  <div className="text-right">
                    <span className={`inline-block px-3 py-1 rounded-full text-xs font-medium ${
                      prescription.status === 'active' ? 'bg-green-500/20 text-green-400' :
                      prescription.status === 'completed' ? 'bg-slate-500/20 text-slate-400' :
                      'bg-red-500/20 text-red-400'
                    }`}>
                      {prescription.status === 'active' ? 'En cours' :
                       prescription.status === 'completed' ? 'Terminé' : 'Annulé'}
                    </span>
                    {prescription.refillsRemaining !== undefined && prescription.status === 'active' && (
                      <p className="text-xs text-slate-500 mt-2">
                        {prescription.refillsRemaining} renouvellement{prescription.refillsRemaining > 1 ? 's' : ''} restant{prescription.refillsRemaining > 1 ? 's' : ''}
                      </p>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}

        {/* Labs Tab */}
        {activeTab === 'labs' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Résultats d'analyses</h2>
              <span className="text-sm text-slate-400">
                Dernière mise à jour : {labResults.length > 0 ? formatDate(labResults[0].date) : '-'}
              </span>
            </div>

            <div className="bg-slate-800 rounded-xl border border-slate-700 overflow-hidden">
              <table className="w-full">
                <thead>
                  <tr className="bg-slate-700/50">
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Analyse</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400">Résultat</th>
                    <th className="text-left px-4 py-3 text-sm font-medium text-slate-400 hidden sm:table-cell">Référence</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-400">Statut</th>
                    <th className="text-center px-4 py-3 text-sm font-medium text-slate-400 hidden sm:table-cell">Tendance</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-700">
                  {labResults.map(result => (
                    <tr key={result.id} className="hover:bg-slate-700/30 transition-colors">
                      <td className="px-4 py-3">
                        <div className="font-medium text-white">{result.testName}</div>
                        <div className="text-xs text-slate-500 sm:hidden">{result.referenceRange}</div>
                      </td>
                      <td className="px-4 py-3">
                        <span className="font-semibold text-white">{result.value}</span>
                        <span className="text-slate-400 ml-1">{result.unit}</span>
                      </td>
                      <td className="px-4 py-3 text-slate-400 text-sm hidden sm:table-cell">
                        {result.referenceRange}
                      </td>
                      <td className="px-4 py-3 text-center">
                        <span className={`inline-block px-2 py-1 rounded-full text-xs font-medium ${getStatusColor(result.status)}`}>
                          {result.status === 'normal' ? 'Normal' :
                           result.status === 'high' ? 'Élevé' :
                           result.status === 'low' ? 'Bas' : 'Critique'}
                        </span>
                      </td>
                      <td className="px-4 py-3 text-center hidden sm:table-cell">
                        {getTrendIcon(result.trend)}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {/* Vaccinations Tab */}
        {activeTab === 'vaccinations' && (
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h2 className="text-lg font-semibold text-white">Carnet de vaccination</h2>
            </div>

            <div className="grid gap-4">
              {vaccinations.map(vaccination => (
                <div
                  key={vaccination.id}
                  className="bg-slate-800 rounded-xl border border-slate-700 p-5"
                >
                  <div className="flex items-start gap-4">
                    <div className="p-3 bg-green-500/20 rounded-xl">
                      <Syringe className="w-6 h-6 text-green-400" />
                    </div>
                    <div className="flex-1">
                      <h3 className="font-semibold text-white">{vaccination.name}</h3>
                      <div className="text-sm text-slate-400 mt-1">
                        Administré le {formatDate(vaccination.date)} par {vaccination.doctor}
                      </div>
                      {vaccination.batchNumber && (
                        <div className="text-xs text-slate-500 mt-1">
                          Lot : {vaccination.batchNumber}
                        </div>
                      )}
                    </div>
                    {vaccination.nextDose && (
                      <div className="text-right">
                        <div className="text-xs text-slate-500">Prochain rappel</div>
                        <div className="text-sm font-medium text-teal-400">
                          {formatDate(vaccination.nextDose)}
                        </div>
                      </div>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        )}

        {/* Timeline Tab */}
        {activeTab === 'timeline' && (
          <div className="space-y-4">
            <h2 className="text-lg font-semibold text-white">Historique médical</h2>

            <div className="relative">
              <div className="absolute left-5 top-0 bottom-0 w-0.5 bg-slate-700" />
              <div className="space-y-6">
                {timeline.map((event, idx) => (
                  <div key={event.id} className="relative flex gap-4 pl-12">
                    <div className={`absolute left-2 w-6 h-6 rounded-full border-2 border-slate-800 flex items-center justify-center ${
                      event.type === 'consultation' ? 'bg-teal-500' :
                      event.type === 'prescription' ? 'bg-blue-500' :
                      event.type === 'lab_result' ? 'bg-purple-500' :
                      event.type === 'vaccination' ? 'bg-green-500' :
                      'bg-slate-500'
                    }`}>
                      {event.type === 'consultation' && <User className="w-3 h-3 text-white" />}
                      {event.type === 'prescription' && <Pill className="w-3 h-3 text-white" />}
                      {event.type === 'lab_result' && <FlaskConical className="w-3 h-3 text-white" />}
                      {event.type === 'vaccination' && <Syringe className="w-3 h-3 text-white" />}
                      {event.type === 'vitals' && <Activity className="w-3 h-3 text-white" />}
                    </div>
                    <div className="flex-1 bg-slate-800 rounded-xl border border-slate-700 p-4">
                      <div className="flex items-start justify-between gap-2">
                        <div>
                          <h3 className="font-semibold text-white">{event.title}</h3>
                          {event.doctor && (
                            <p className="text-sm text-slate-400">
                              {event.doctor}
                              {event.specialty && ` • ${event.specialty}`}
                            </p>
                          )}
                          {event.summary && (
                            <p className="text-sm text-slate-500 mt-2">{event.summary}</p>
                          )}
                        </div>
                        <span className="text-xs text-slate-500 whitespace-nowrap">
                          {formatDate(event.date)}
                        </span>
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
