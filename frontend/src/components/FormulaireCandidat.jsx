import React, { useState } from 'react';
import api, { coverLetterAPI } from "../services/api";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import UploadCV from "./UploadCV"; 
import {
  Document, Packer, Paragraph, TextRun
} from "docx";
import {
  Sparkles, Target, Award, CheckCircle2, AlertCircle,
  XCircle, ChevronRight, Upload, Download, TrendingUp,
  Zap, FileText, Briefcase, Loader, X
} from "lucide-react";

function FormulaireCandidat() {
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    ville: '', poste: '', entreprise: '', competences: ''
  });
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');
  const [cvFile, setCvFile] = useState(null);

  // AI + ATS State
  const [aiTips, setAiTips] = useState(null);
  const [atsScore, setAtsScore] = useState(null);
  const [cvImprovements, setCvImprovements] = useState(null);
  const [showAiPanel, setShowAiPanel] = useState(false);
  const [showAtsPanel, setShowAtsPanel] = useState(false);
  const [showCvPanel, setShowCvPanel] = useState(false);
  const [aiLoading, setAiLoading] = useState(false);
  const [atsLoading, setAtsLoading] = useState(false);


  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    setLetter('');
    try {
      const response = await coverLetterAPI.generate(formData);
      setLetter(response.data.lettre || response.data.letter || "");
    } catch (err) {
      console.error('Erreur:', err);
      setError('Erreur lors de la génération. Vérifiez le backend.');
    } finally {
      setLoading(false);
    }
  };

  // Upload CV
  const handleCvUpload = async (e) => {
    const file = e.target.files[0];
    if (!file) return;
    setCvFile(file);
    
    const formDataUpload = new FormData();
    formDataUpload.append('cv', file);
    
    try {
      await api.post('/upload-cv', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });
      setError('✅ CV uploadé avec succès!');
      setTimeout(() => setError(''), 3000);
    } catch (err) {
      setError('❌ Erreur upload CV');
    }
  };

  // AI Tips
  const loadAiTips = async () => {
    setAiLoading(true);
    setError('');
    try {
      const res = await api.get("/applications/ai-tips");
      setAiTips(res.data);
      setShowAiPanel(true);
      setShowAtsPanel(false);
      setShowCvPanel(false);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Erreur chargement conseils'}`);
    } finally {
      setAiLoading(false);
    }
  };

  // ATS Score
  const loadAtsScore = async () => {
    setAtsLoading(true);
    setError('');
    try {
      const res = await api.get("/applications/ats-score");
      setAtsScore(res.data);
      setShowAtsPanel(true);
      setShowAiPanel(false);
      setShowCvPanel(false);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Erreur score ATS'}`);
    } finally {
      setAtsLoading(false);
    }
  };

  // CV Improvements
  const loadCvImprovements = async () => {
    try {
      const res = await api.get("/applications/cv-improvements");
      setCvImprovements(res.data);
      setShowCvPanel(true);
      setShowAiPanel(false);
      setShowAtsPanel(false);
    } catch (err) {
      setError(`❌ ${err.response?.data?.message || 'Erreur'}`);
    }
  };

  // Downloads
  const downloadWord = async () => {
    const doc = new Document({
      sections: [{
        children: [
          new Paragraph({ text: `${formData.prenom} ${formData.nom}` }),
          new Paragraph({ text: formData.email }),
          new Paragraph({ text: formData.telephone }),
          new Paragraph(""),
          new Paragraph({
            children: [new TextRun({
              text: `Objet : Candidature au poste de ${formData.poste}`,
              bold: true
            })]
          }),
          new Paragraph(""),
          ...letter.split("\n").map(line => new Paragraph(line))
        ]
      }]
    });
    const blob = await Packer.toBlob(doc);
    saveAs(blob, "Lettre_de_Motivation.docx");
  };

  const downloadPDF = () => {
    const doc = new jsPDF();
    let y = 20;
    doc.setFontSize(12);
    doc.text(`${formData.prenom} ${formData.nom}`, 10, y); y += 7;
    doc.text(formData.email, 10, y); y += 7;
    doc.text(formData.telephone, 10, y); y += 10;
    doc.text(`${formData.ville}, le ${new Date().toLocaleDateString()}`, 140, y); y += 15;
    doc.text(`À l'attention du Responsable Recrutement`, 10, y); y += 7;
    doc.text(formData.entreprise, 10, y); y += 10;
    doc.setFont(undefined, "bold");
    doc.text(`Objet : Candidature au poste de ${formData.poste}`, 10, y);
    doc.setFont(undefined, "normal");
    y += 15;
    const lines = doc.splitTextToSize(letter, 180);
    doc.text(lines, 10, y);
    doc.save("Lettre_de_Motivation.pdf");
  };

  return (
    <div>
      <div className="flex items-center gap-2 mb-6">
        <Upload size={18} className="text-blue-600" />
        <h2 className="text-lg font-semibold text-slate-900">Téléchargez votre CV</h2>
      </div>
      <UploadCV onFileSelect={handleCvUpload} />
      {/* MAIN GRID */}
      <div className="grid grid-cols-1 lg:grid-cols-12 gap-6">

        {/* LEFT: FORM (5 cols) */}
        <div className="lg:col-span-5">
          <form onSubmit={handleSubmit} className="space-y-6">

            {/* Informations Personnelles */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-slate-700 font-semibold mb-4 flex items-center gap-2">
                <span>📋</span> Vos Informations
              </h3>
              
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Nom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="nom" value={formData.nom}
                    onChange={handleChange} placeholder="Ex: Saadeddine"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  />
                </div>
                <div>
                  <label className="block text-sm font-medium text-slate-700 mb-1">
                    Prénom <span className="text-red-500">*</span>
                  </label>
                  <input
                    type="text" name="prenom" value={formData.prenom}
                    onChange={handleChange} placeholder="Ex: Ahmed"
                    required
                    className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                  />
                </div>
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Email <span className="text-red-500">*</span>
                </label>
                <input
                  type="email" name="email" value={formData.email}
                  onChange={handleChange} placeholder="Ex: ahmed@example.com"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Téléphone <span className="text-red-500">*</span>
                </label>
                <input
                  type="tel" name="telephone" value={formData.telephone}
                  onChange={handleChange} placeholder="Ex: +212 6 12 34 56 78"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                />
              </div>

              <div className="mt-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Ville <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" name="ville" value={formData.ville}
                  onChange={handleChange} placeholder="Ex: Tanger"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm"
                />
              </div>
            </div>

            {/* Détails du Poste */}
            <div className="bg-blue-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="text-blue-700 font-semibold mb-4 flex items-center gap-2">
                <span>💼</span> Détails du Poste
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Poste visé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" name="poste" value={formData.poste}
                  onChange={handleChange} placeholder="Ex: Développeur Full Stack"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Entreprise <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" name="entreprise" value={formData.entreprise}
                  onChange={handleChange} placeholder="Ex: Google"
                  required
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm"
                />
              </div>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Compétences <span className="text-red-500">*</span>
                </label>
                <textarea
                  name="competences" value={formData.competences}
                  onChange={handleChange}
                  placeholder="Ex: React, Python, Flask, MySQL, Docker, Git"
                  required rows="3"
                  className="w-full px-3 py-2 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-indigo-600 text-white rounded-xl font-bold text-lg hover:bg-indigo-700 disabled:opacity-50 disabled:cursor-not-allowed transition-colors flex items-center justify-center gap-2"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Génération...
                </>
              ) : (
                <>
                  <Zap size={20} />
                  Générer la Lettre
                </>
              )}
            </button>
          </form>

          {/* Error */}
          {error && (
            <div className={`mt-4 p-4 rounded-xl border-l-4 text-sm ${
              error.includes('✅') 
                ? 'bg-green-50 border-green-500 text-green-700' 
                : 'bg-red-50 border-red-500 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* AI Preview */}
          {letter && (
            <div className="mt-4 p-4 bg-green-50 rounded-xl border-l-4 border-green-500">
              <div className="flex items-center gap-2 mb-2">
                <Sparkles size={16} className="text-green-600" />
                <h4 className="text-green-800 font-medium text-sm">💡 Conseil IA</h4>
              </div>
              <p className="text-green-700 text-sm">
                Votre lettre est prête! Postulez à au moins <strong>5 offres par semaine</strong>.
              </p>
            </div>
          )}

          {/* Letter Result */}
          {letter && (
            <div className="mt-6 bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-indigo-600 font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} />
                Lettre Générée
              </h3>
              <pre className="whitespace-pre-wrap font-serif text-sm text-slate-700 bg-slate-50 p-4 rounded-xl leading-relaxed">
                {letter}
              </pre>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => { navigator.clipboard.writeText(letter); alert("Copiée!"); }}
                  className="px-4 py-2 bg-green-600 text-white rounded-xl text-sm font-medium hover:bg-green-700 flex items-center gap-2"
                >
                  📋 Copier
                </button>
                <button
                  onClick={downloadWord}
                  className="px-4 py-2 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2"
                >
                  📄 Word
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 flex items-center gap-2"
                >
                  📕 PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: SPACER (3 cols) */}
        <div className="hidden lg:block lg:col-span-3">
          {/* Vide — bach layout ykoun mizan */}
        </div>

        {/* RIGHT: AI + ATS CARDS (4 cols) */}
        <div className="lg:col-span-4 space-y-4">

          {/* Conseils IA */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-indigo-50 rounded-lg">
                <Sparkles size={20} className="text-indigo-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Conseils IA</h4>
                <p className="text-xs text-slate-500">Basés sur votre historique</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Analyse personnalisée de vos candidatures.
            </p>
            <button
              onClick={loadAiTips}
              disabled={aiLoading}
              className="w-full py-2 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {aiLoading ? <Loader size={14} className="animate-spin" /> : <TrendingUp size={14} />}
              {aiLoading ? 'Analyse...' : 'Voir mes conseils'}
            </button>
          </div>

          {/* Score ATS */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-amber-50 rounded-lg">
                <Target size={20} className="text-amber-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Score ATS</h4>
                <p className="text-xs text-slate-500">Optimisation CV</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Vérifiez si votre CV passe les filtres.
            </p>
            <button
              onClick={loadAtsScore}
              disabled={atsLoading}
              className="w-full py-2 bg-amber-600 text-white rounded-xl text-sm font-medium hover:bg-amber-700 disabled:opacity-50 flex items-center justify-center gap-2"
            >
              {atsLoading ? <Loader size={14} className="animate-spin" /> : <Target size={14} />}
              {atsLoading ? 'Analyse...' : 'Vérifier mon CV'}
            </button>
          </div>

          {/* Améliorer CV */}
          <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
            <div className="flex items-center gap-3 mb-3">
              <div className="p-2 bg-emerald-50 rounded-lg">
                <Award size={20} className="text-emerald-600" />
              </div>
              <div>
                <h4 className="font-semibold text-slate-900 text-sm">Améliorer CV</h4>
                <p className="text-xs text-slate-500">Conseils détaillés</p>
              </div>
            </div>
            <p className="text-xs text-slate-600 mb-3">
              Recommandations priorisées.
            </p>
            <button
              onClick={loadCvImprovements}
              className="w-full py-2 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center justify-center gap-2"
            >
              <Briefcase size={14} />
              Voir les améliorations
            </button>
          </div>

          {/* AI PANEL */}
          {showAiPanel && aiTips && (
            <div className="bg-white rounded-2xl border border-indigo-200 p-5 shadow-md max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-indigo-900 text-sm">✨ Vos Conseils</h4>
                <button onClick={() => setShowAiPanel(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="grid grid-cols-2 gap-2 mb-4">
                <div className="text-center p-2 bg-indigo-50 rounded-lg">
                  <p className="text-lg font-bold text-indigo-600">{aiTips.total_applications}</p>
                  <p className="text-xs text-slate-500">Candidatures</p>
                </div>
                <div className="text-center p-2 bg-green-50 rounded-lg">
                  <p className="text-lg font-bold text-green-600">{aiTips.stats.accepted}</p>
                  <p className="text-xs text-slate-500">Acceptées</p>
                </div>
              </div>
              <div className="space-y-2">
                {aiTips.tips.map((tip, idx) => (
                  <div key={idx} className={`p-3 rounded-lg text-xs ${
                    tip.type === 'success' ? 'bg-green-50 text-green-700 border border-green-200' :
                    tip.type === 'warning' ? 'bg-orange-50 text-orange-700 border border-orange-200' :
                    tip.type === 'error' ? 'bg-red-50 text-red-700 border border-red-200' :
                    'bg-blue-50 text-blue-700 border border-blue-200'
                  }`}>
                    <p className="font-medium">{tip.title}</p>
                    <p className="mt-1">{tip.message}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* ATS PANEL */}
          {showAtsPanel && atsScore && (
            <div className="bg-white rounded-2xl border border-amber-200 p-5 shadow-md max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-amber-900 text-sm">🎯 Score ATS</h4>
                <button onClick={() => setShowAtsPanel(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="text-center mb-4">
                <div className={`w-20 h-20 mx-auto rounded-full border-4 flex items-center justify-center ${
                  atsScore.score >= 85 ? 'border-green-500 bg-green-50' :
                  atsScore.score >= 65 ? 'border-blue-500 bg-blue-50' :
                  atsScore.score >= 45 ? 'border-orange-500 bg-orange-50' :
                  'border-red-500 bg-red-50'
                }`}>
                  <div>
                    <p className="text-2xl font-bold">{atsScore.score}</p>
                    <p className="text-xs text-slate-500">/100</p>
                  </div>
                </div>
                <p className={`mt-2 text-xs font-medium ${
                  atsScore.score >= 85 ? 'text-green-600' :
                  atsScore.score >= 65 ? 'text-blue-600' :
                  atsScore.score >= 45 ? 'text-orange-600' :
                  'text-red-600'
                }`}>
                  {atsScore.status_text}
                </p>
              </div>
              <div className="space-y-2">
                {atsScore.tips.slice(0, 4).map((tip, idx) => (
                  <div key={idx} className="flex items-start gap-2 p-2 bg-slate-50 rounded-lg text-xs">
                    <ChevronRight size={12} className="text-indigo-400 mt-0.5" />
                    <span className="text-slate-600">{tip}</span>
                  </div>
                ))}
              </div>
            </div>
          )}

          {/* CV IMPROVEMENTS PANEL */}
          {showCvPanel && cvImprovements && (
            <div className="bg-white rounded-2xl border border-emerald-200 p-5 shadow-md max-h-96 overflow-y-auto">
              <div className="flex items-center justify-between mb-4">
                <h4 className="font-semibold text-emerald-900 text-sm">🏆 Améliorations</h4>
                <button onClick={() => setShowCvPanel(false)} className="text-slate-400 hover:text-slate-600">
                  <X size={16} />
                </button>
              </div>
              <div className="space-y-2">
                {cvImprovements.improvements.map((imp, idx) => (
                  <div key={idx} className={`p-3 rounded-lg text-xs border ${
                    imp.priority === 'critical' ? 'bg-red-50 border-red-200' :
                    imp.priority === 'high' ? 'bg-orange-50 border-orange-200' :
                    imp.priority === 'medium' ? 'bg-blue-50 border-blue-200' :
                    'bg-slate-50 border-slate-200'
                  }`}>
                    <span className={`inline-block px-2 py-0.5 rounded text-xs font-bold mb-1 ${
                      imp.priority === 'critical' ? 'bg-red-200 text-red-700' :
                      imp.priority === 'high' ? 'bg-orange-200 text-orange-700' :
                      imp.priority === 'medium' ? 'bg-blue-200 text-blue-700' :
                      'bg-slate-200 text-slate-700'
                    }`}>
                      {imp.priority.toUpperCase()}
                    </span>
                    <p className="font-medium text-slate-900">{imp.section}</p>
                    <p className="text-slate-600 mt-1">{imp.tip}</p>
                    <p className="text-indigo-600 mt-1 font-medium">💡 {imp.action}</p>
                  </div>
                ))}
              </div>
            </div>
          )}

        </div>
      </div>
    </div>
  );
}

export default FormulaireCandidat;