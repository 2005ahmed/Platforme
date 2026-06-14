import React, { useState, useRef, useEffect } from 'react';
import api, { coverLetterAPI } from "../services/api";
import { saveAs } from "file-saver";
import jsPDF from "jspdf";
import {
  Document, Packer, Paragraph, TextRun
} from "docx";
import {
  Sparkles, Target, Award, CheckCircle2, AlertCircle,
  XCircle, ChevronRight, Upload, Download, TrendingUp,
  Zap, FileText, Briefcase, Loader, X, MessageCircle,
  Send, User, Bot, FileUp, Paperclip, Wand2, Star,
  BarChart3, Lightbulb, Edit3, ArrowRight, BookOpen,
  Code, Globe
} from "lucide-react";

// ⭐ FONCTION BACH TSE7A7 L-TEXT (remove markdown)
function formatAiText(text) {
  if (!text) return "";
  return text
    .replace(/\n\n/g, '\n')
    .replace(/\n/g, '\n')
    .replace(/\*\*(.*?)\*\*/g, '$1')
    .replace(/\*(.*?)\*/g, '$1')
    .trim();
}

// ⭐ FONCTION BACH TPARSE L-ANALYSE CV
  function parseAiAnalysis(data) {
  // Ila kan data deja object (JSON), parse direct
  if (typeof data === 'object' && data !== null) {
    const sections = [];
    
    // Résumé
    if (data.resume) {
      sections.push({
        title: 'Résumé',
        items: [data.resume],
        type: 'text'
      });
    }
    
    // Points forts
    if (data.strengths && Array.isArray(data.strengths)) {
      sections.push({
        title: 'Points forts',
        items: data.strengths,
        type: 'list'
      });
    }
    
    // Points faibles
    if (data.weaknesses && Array.isArray(data.weaknesses)) {
      sections.push({
        title: 'Points faibles',
        items: data.weaknesses,
        type: 'list'
      });
    }
    
    // Suggestions
    if (data.suggestions && Array.isArray(data.suggestions)) {
      sections.push({
        title: 'Suggestions',
        items: data.suggestions,
        type: 'list'
      });
    }
    
    // Score
    if (data.score) {
      sections.push({
        title: 'Score',
        items: [`Grade: ${data.score.grade || 'N/A'}`, `Score: ${data.score.overall || 'N/A'}/10`],
        type: 'list'
      });
    }
    
    return sections;
  }
  
  // Sinon, ancien parsing (string/markdown)
  if (!data || typeof data !== 'string') return [];
  
  const lines = data.split('\n').filter(l => l.trim());
  const sections = [];
  let currentSection = null;
  
  lines.forEach(line => {
    const trimmed = line.trim();
    
    // Detect section headers (avec ** ou :)
    if (trimmed.match(/^\*\*.*\*\*:*/) || 
        trimmed.match(/^(Points forts|Points faibles|Points à améliorer|Points a ameliorer|Suggestions|Score global|Score|Résumé|Analyse|Conseils|Recommandations|Formations|Compétences|Competences|Langues)/i)) {
      
      if (currentSection) sections.push(currentSection);
      
      const title = trimmed
        .replace(/^\*\*/, '')
        .replace(/\*\*$/, '')
        .replace(/:$/, '')
        .replace(/\*+$/, '')
        .trim();
      
      currentSection = {
        title: title,
        items: [],
        type: 'list'
      };
    } 
    // Detect list items
    else if (trimmed.match(/^[-•]\s*/) || trimmed.match(/^\*\s+/) || trimmed.match(/^\d+\.\s*/)) {
      if (!currentSection) {
        currentSection = { title: 'Analyse', items: [], type: 'list' };
      }
      const cleanItem = trimmed
        .replace(/^[-•]\s*/, '')
        .replace(/^\*\s+/, '')
        .replace(/^\d+\.\s*/, '')
        .replace(/\*\*/g, '')
        .trim();
      currentSection.items.push(cleanItem);
    } 
    // Regular text
    else if (trimmed) {
      if (!currentSection) {
        currentSection = { title: 'Résumé', items: [], type: 'text' };
      }
      const cleanText = trimmed.replace(/\*\*/g, '').trim();
      currentSection.items.push(cleanText);
    }
  });
  
  if (currentSection) sections.push(currentSection);
  return sections;
}

function FormulaireCandidat() {
  const [formData, setFormData] = useState({
    nom: '', prenom: '', email: '', telephone: '',
    ville: '', poste: '', entreprise: '', competences: ''
  });
  const [letter, setLetter] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState('');

  // ⭐ CV ANALYSIS STATE
  const [cvAnalysis, setCvAnalysis] = useState(null);
  const [cvAnalysisLoading, setCvAnalysisLoading] = useState(false);
  const [cvFile, setCvFile] = useState(null);
  const [showCvAnalysis, setShowCvAnalysis] = useState(false);

  // ⭐ CHAT STATE
  const [chatMessages, setChatMessages] = useState([]);
  const [chatInput, setChatInput] = useState('');
  const [chatLoading, setChatLoading] = useState(false);
  const [showChat, setShowChat] = useState(false);
  const [chatSessionId, setChatSessionId] = useState(null);
  const chatEndRef = useRef(null);
  const fileInputRef = useRef(null);

  // Auto-scroll chat
  useEffect(() => {
    chatEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [chatMessages]);

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
      setError('Erreur lors de la génération. Vérifiez le backend.');
    } finally {
      setLoading(false);
    }
  };

  // ⭐ ANALYSE CV DIRECT
  const handleCvUploadForAnalysis = async (e) => {
    const file = e.target.files[0];
    if (!file) return;

    setCvFile(file);
    setCvAnalysisLoading(true);
    setShowCvAnalysis(true);
    setError('');

    const formDataUpload = new FormData();
    formDataUpload.append('cv', file);
    formDataUpload.append('job_description', formData.poste + ' chez ' + formData.entreprise);

    try {
      const response = await api.post('/ai/analyze-cv', formDataUpload, {
        headers: { 'Content-Type': 'multipart/form-data' }
      });

      const data = response.data;

      if (!data || data.error) {
        throw new Error(data.error || data.message || "Erreur serveur");
      }

      // ⭐ STOCKER L-DATA
      setCvAnalysis({
        ai_analysis: data.ai_analysis,
        ats_score: data.ats_score,
        cv_text_preview: data.cv_text_preview
      });
      setChatSessionId(data.session_id);
      setShowChat(true);

      // ⭐ PARSE ET AFFICHER DIRECT
      const sections = parseAiAnalysis(data.ai_analysis);
      setChatMessages([{
        role: 'assistant',
        content: 'analysis',
        sections: sections,
        ats_score: data.ats_score
      }]);

    } catch (err) {
      const errorMsg = err.response?.data?.details || err.response?.data?.error || err.message;
      setError('❌ ' + errorMsg);
      setCvAnalysis(null);
      setShowCvAnalysis(false);
    } finally {
      setCvAnalysisLoading(false);
    }
  };

  // ⭐ CHAT FUNCTIONS
  const sendChatMessage = async () => {
    if (!chatInput.trim()) return;

    const userMsg = chatInput.trim();
    setChatInput('');
    setChatLoading(true);

    setChatMessages(prev => [...prev, { role: 'user', content: userMsg }]);

    try {
      let response;

      if (chatSessionId) {
        response = await api.post('/ai/chat-cv', {
          session_id: chatSessionId,
          message: userMsg
        });
      } else {
        response = await api.post('/ai/chat', {
          message: userMsg,
          history: chatMessages.map(m => ({ role: m.role, content: m.content }))
        });
      }

      const aiResponse = response.data.response || "Je n'ai pas compris.";
      setChatMessages(prev => [...prev, { role: 'assistant', content: aiResponse }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erreur: ' + (err.response?.data?.details || 'Service indisponible')
      }]);
    } finally {
      setChatLoading(false);
    }
  };

  // ⭐ REFORMULER SECTION
  const rewriteSection = async (section) => {
    if (!chatSessionId) return;

    setChatLoading(true);
    setChatMessages(prev => [...prev, {
      role: 'user',
      content: `✏️ Reformule ma section "${section}"`
    }]);

    try {
      const response = await api.post('/rewrite-cv-section', {
        session_id: chatSessionId,
        section: section,
        instructions: 'Rendre plus impactante et professionnelle'
      });

      const newVersion = response.data.new_version;
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: newVersion,
        isRewrite: true,
        section: section
      }]);
    } catch (err) {
      setChatMessages(prev => [...prev, {
        role: 'assistant',
        content: '❌ Erreur: ' + (err.response?.data?.details || 'Service indisponible')
      }]);
    } finally {
      setChatLoading(false);
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

  // ⭐ RENDER SECTION DYAL ANALYSE
  const renderAnalysisSection = (section, idx) => {
    const colors = {
      'Points forts': 'bg-emerald-50 border-emerald-200 text-emerald-800',
      'Points faibles': 'bg-rose-50 border-rose-200 text-rose-800',
      'Points à améliorer': 'bg-amber-50 border-amber-200 text-amber-800',
      'Points a ameliorer': 'bg-amber-50 border-amber-200 text-amber-800',
      'Suggestions': 'bg-blue-50 border-blue-200 text-blue-800',
      'Score global': 'bg-purple-50 border-purple-200 text-purple-800',
      'Score': 'bg-purple-50 border-purple-200 text-purple-800',
      'Résumé': 'bg-slate-50 border-slate-200 text-slate-800',
      'Analyse': 'bg-indigo-50 border-indigo-200 text-indigo-800',
      'Conseils': 'bg-cyan-50 border-cyan-200 text-cyan-800',
      'Recommandations': 'bg-teal-50 border-teal-200 text-teal-800',
      'Formations': 'bg-violet-50 border-violet-200 text-violet-800',
      'Compétences': 'bg-sky-50 border-sky-200 text-sky-800',
      'Competences': 'bg-sky-50 border-sky-200 text-sky-800',
      'Langues': 'bg-pink-50 border-pink-200 text-pink-800'
    };

    const icons = {
      'Points forts': Star,
      'Points faibles': AlertCircle,
      'Points à améliorer': Lightbulb,
      'Points a ameliorer': Lightbulb,
      'Suggestions': Wand2,
      'Score global': BarChart3,
      'Score': BarChart3,
      'Résumé': FileText,
      'Analyse': Target,
      'Conseils': Sparkles,
      'Recommandations': CheckCircle2,
      'Formations': BookOpen,
      'Compétences': Code,
      'Competences': Code,
      'Langues': Globe
    };

    const colorClass = colors[section.title] || 'bg-slate-50 border-slate-200 text-slate-800';
    const IconComponent = icons[section.title] || FileText;

    return (
      <div key={idx} className={`rounded-xl border p-4 mb-3 ${colorClass}`}>
        <div className="flex items-center gap-2 mb-3">
          <IconComponent size={18} />
          <h4 className="font-semibold text-sm">{section.title}</h4>
        </div>
        <ul className="space-y-2">
          {section.items.map((item, i) => (
            <li key={i} className="text-sm flex items-start gap-2">
              <ArrowRight size={14} className="mt-1 flex-shrink-0 opacity-60" />
              <span className="leading-relaxed">{item}</span>
            </li>
          ))}
        </ul>
      </div>
    );
  };

  // ⭐ RENDER ATS SCORE
  const renderAtsScore = (score) => {
  if (!score) return null;
  
  // Ila kan score object avec 'overall' (pas 'overall_score')
  const s = score.overall_score || score.overall || 0;
  // Converti 7/10 → 70/100 pour l'affichage
  const displayScore = s <= 10 ? s * 10 : s;
  
  const color = displayScore >= 80 ? 'text-emerald-600' : displayScore >= 60 ? 'text-blue-600' : displayScore >= 40 ? 'text-amber-600' : 'text-rose-600';
  const bg = displayScore >= 80 ? 'bg-emerald-50 border-emerald-200' : displayScore >= 60 ? 'bg-blue-50 border-blue-200' : displayScore >= 40 ? 'bg-amber-50 border-amber-200' : 'bg-rose-50 border-rose-200';

  return (
    <div className={`rounded-xl border p-4 mb-4 ${bg}`}>
      <div className="flex items-center justify-between mb-2">
        <div className="flex items-center gap-2">
          <BarChart3 size={20} className={color} />
          <h4 className="font-semibold text-sm">Score ATS</h4>
        </div>
        <span className={`text-2xl font-bold ${color}`}>{s}/100</span>
      </div>
      <div className="w-full bg-white rounded-full h-2">
        <div 
          className={`h-2 rounded-full ${displayScore >= 80 ? 'bg-emerald-500' : displayScore >= 60 ? 'bg-blue-500' : displayScore >= 40 ? 'bg-amber-500' : 'bg-rose-500'}`}
          style={{ width: `${displayScore}%` }}
        />
      </div>
      <p className="text-xs mt-2 opacity-75">
        {score.grade ? `Grade: ${score.grade}` : ''}
        {score.is_ats_friendly ? ' ✅ CV optimisé ATS' : ' ⚠️ Amélioration recommandée'}
      </p>
    </div>
  );
};

  return (
    <div className="max-w-7xl mx-auto p-6">
      
      {/* HEADER */}
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900 mb-2">
          Générateur de Lettre de Motivation
        </h1>
        <p className="text-slate-500">
          Remplissez vos informations et laissez l'IA créer votre lettre personnalisée
        </p>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-12 gap-8">

        {/* LEFT: FORM + CV UPLOAD (5 cols) */}
        <div className="lg:col-span-5 space-y-6">
          
          {/* ⭐ UPLOAD CV SECTION */}
          <div className="bg-gradient-to-br from-indigo-50 to-purple-50 rounded-2xl border border-indigo-100 p-6">
            <div className="flex items-center gap-3 mb-4">
              <div className="p-2 bg-indigo-100 rounded-lg">
                <Upload size={20} className="text-indigo-600" />
              </div>
              <div>
                <h3 className="font-semibold text-indigo-900">Analyser votre CV</h3>
                <p className="text-xs text-indigo-600">L'IA analysera votre CV et vous donnera des conseils</p>
              </div>
            </div>
            
            <label className="flex flex-col items-center justify-center w-full h-32 border-2 border-dashed border-indigo-200 rounded-xl bg-white/50 hover:bg-white cursor-pointer transition-all hover:border-indigo-400">
              <div className="flex flex-col items-center justify-center pt-5 pb-6">
                <FileUp size={28} className="text-indigo-400 mb-2" />
                <p className="text-sm text-indigo-600 font-medium">
                  {cvFile ? cvFile.name : 'Cliquez pour uploader votre CV'}
                </p>
                <p className="text-xs text-indigo-400 mt-1">PDF, DOCX, ou Image</p>
              </div>
              <input 
                type="file" 
                className="hidden" 
                onChange={handleCvUploadForAnalysis}
                accept=".pdf,.docx,.doc,.png,.jpg,.jpeg"
              />
            </label>

            {cvAnalysisLoading && (
              <div className="mt-4 flex items-center gap-2 text-indigo-600 text-sm">
                <Loader size={16} className="animate-spin" />
                <span>Analyse en cours...</span>
              </div>
            )}
          </div>

          {/* FORMULAIRE */}
          <form onSubmit={handleSubmit} className="space-y-6">
            
            {/* Informations Personnelles */}
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-slate-700 font-semibold mb-4 flex items-center gap-2">
                <User size={18} className="text-indigo-500" />
                Vos Informations
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
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
                    className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-500 focus:bg-white text-sm transition-all"
                />
              </div>
            </div>

            {/* Détails du Poste */}
            <div className="bg-gradient-to-br from-blue-50 to-indigo-50 rounded-2xl border border-blue-100 p-6">
              <h3 className="text-blue-700 font-semibold mb-4 flex items-center gap-2">
                <Briefcase size={18} className="text-blue-500" />
                Détails du Poste
              </h3>

              <div className="mb-4">
                <label className="block text-sm font-medium text-slate-700 mb-1">
                  Poste visé <span className="text-red-500">*</span>
                </label>
                <input
                  type="text" name="poste" value={formData.poste}
                  onChange={handleChange} placeholder="Ex: Développeur Full Stack"
                  required
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm transition-all"
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
                  className="w-full px-3 py-2.5 rounded-xl border border-blue-200 bg-white focus:outline-none focus:ring-2 focus:ring-blue-500 text-sm resize-y transition-all"
                />
              </div>
            </div>

            {/* Submit Button */}
            <button
              type="submit"
              disabled={loading}
              className="w-full py-4 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-xl font-bold text-lg hover:from-indigo-700 hover:to-purple-700 disabled:opacity-50 disabled:cursor-not-allowed transition-all flex items-center justify-center gap-2 shadow-lg hover:shadow-xl"
            >
              {loading ? (
                <>
                  <Loader size={20} className="animate-spin" />
                  Génération en cours...
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
            <div className={`p-4 rounded-xl border-l-4 text-sm ${
              error.includes('✅') 
                ? 'bg-green-50 border-green-500 text-green-700' 
                : 'bg-red-50 border-red-500 text-red-700'
            }`}>
              {error}
            </div>
          )}

          {/* Letter Result */}
          {letter && (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
              <h3 className="text-indigo-600 font-semibold mb-4 flex items-center gap-2">
                <FileText size={18} />
                Lettre Générée
              </h3>
              <div className="bg-slate-50 p-4 rounded-xl border border-slate-100">
                <pre className="whitespace-pre-wrap font-serif text-sm text-slate-700 leading-relaxed">
                  {letter}
                </pre>
              </div>
              
              <div className="flex flex-wrap gap-3 mt-4">
                <button
                  onClick={() => { navigator.clipboard.writeText(letter); alert("Copiée!"); }}
                  className="px-4 py-2.5 bg-emerald-600 text-white rounded-xl text-sm font-medium hover:bg-emerald-700 flex items-center gap-2 transition-all"
                >
                  <FileText size={16} />
                  Copier
                </button>
                <button
                  onClick={downloadWord}
                  className="px-4 py-2.5 bg-blue-600 text-white rounded-xl text-sm font-medium hover:bg-blue-700 flex items-center gap-2 transition-all"
                >
                  <Download size={16} />
                  Word
                </button>
                <button
                  onClick={downloadPDF}
                  className="px-4 py-2.5 bg-red-600 text-white rounded-xl text-sm font-medium hover:bg-red-700 flex items-center gap-2 transition-all"
                >
                  <Download size={16} />
                  PDF
                </button>
              </div>
            </div>
          )}
        </div>

        {/* CENTER: SPACER (1 col) */}
        <div className="hidden lg:block lg:col-span-1" />

        {/* RIGHT: CV ANALYSIS (6 cols) */}
        <div className="lg:col-span-6">
          
          {/* ⭐ CV ANALYSIS PANEL */}
          {showCvAnalysis && cvAnalysis && (
            <div className="bg-white rounded-2xl border border-slate-200 shadow-lg overflow-hidden">
              {/* Header */}
              <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-6 py-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <Bot size={24} />
                    <div>
                      <h3 className="font-bold text-lg">Analyse IA de votre CV</h3>
                      <p className="text-indigo-200 text-sm">{cvAnalysis.file_name}</p>
                    </div>
                  </div>
                  <button 
                    onClick={() => setShowCvAnalysis(false)}
                    className="p-2 hover:bg-white/20 rounded-lg transition-colors"
                  >
                    <X size={20} />
                  </button>
                </div>
              </div>

              <div className="p-6 max-h-[800px] overflow-y-auto">
                {/* ATS Score */}
                {renderAtsScore(cvAnalysis.ats_score)}

                {/* AI Analysis Sections */}
                {parseAiAnalysis(cvAnalysis.ai_analysis).map((section, idx) => 
                  renderAnalysisSection(section, idx)
                )}

                {/* Action Buttons */}
                <div className="mt-6 flex flex-wrap gap-2">
                  <button
                    onClick={() => rewriteSection('expérience')}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center gap-2 transition-all"
                  >
                    <Edit3 size={14} />
                    Reformuler Expérience
                  </button>
                  <button
                    onClick={() => rewriteSection('compétences')}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center gap-2 transition-all"
                  >
                    <Edit3 size={14} />
                    Reformuler Compétences
                  </button>
                  <button
                    onClick={() => rewriteSection('résumé')}
                    className="px-3 py-2 bg-indigo-50 text-indigo-700 rounded-lg text-sm font-medium hover:bg-indigo-100 flex items-center gap-2 transition-all"
                  >
                    <Edit3 size={14} />
                    Reformuler Résumé
                  </button>
                </div>
              </div>
            </div>
          )}

          {/* ⭐ PLACEHOLDER */}
          {!showCvAnalysis && (
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl border border-slate-200 p-12 text-center">
              <div className="w-20 h-20 bg-white rounded-full flex items-center justify-center mx-auto mb-4 shadow-sm">
                <FileText size={32} className="text-slate-400" />
              </div>
              <h3 className="text-lg font-semibold text-slate-700 mb-2">
                Analysez votre CV
              </h3>
              <p className="text-slate-500 text-sm max-w-sm mx-auto">
                Uploadez votre CV pour recevoir une analyse détaillée avec conseils personnalisés de notre IA
              </p>
            </div>
          )}
        </div>
      </div>

      {/* ⭐ CHAT BUTTON */}
      <div className="fixed bottom-6 right-6 z-50">
        <button
          onClick={() => setShowChat(!showChat)}
          className="w-14 h-14 bg-gradient-to-r from-indigo-600 to-purple-600 text-white rounded-full shadow-lg hover:shadow-xl flex items-center justify-center transition-all hover:scale-110"
          title="Discuter avec l'IA"
        >
          <MessageCircle size={24} />
        </button>
      </div>

      {/* ⭐ CHAT PANEL */}
      {showChat && (
        <div className="fixed bottom-24 right-6 w-96 h-[500px] bg-white rounded-2xl shadow-2xl border border-slate-200 flex flex-col z-50 overflow-hidden">
          {/* Header */}
          <div className="bg-gradient-to-r from-indigo-600 to-purple-600 text-white px-4 py-3 flex items-center justify-between">
            <div className="flex items-center gap-2">
              <Bot size={20} />
              <span className="font-semibold">Job Chat</span>
            </div>
            <button
              onClick={() => setShowChat(false)}
              className="p-1 hover:bg-white/20 rounded-lg transition-colors"
            >
              <X size={18} />
            </button>
          </div>

          {/* Messages */}
          <div className="flex-1 overflow-y-auto p-4 space-y-3">
            {chatMessages.length === 0 && (
              <div className="text-center text-slate-400 py-8">
                <Bot size={40} className="mx-auto mb-3 opacity-50" />
                <p className="text-sm">Commencez une conversation avec l'IA</p>
              </div>
            )}

            {chatMessages.map((msg, idx) => (
              <div
                key={idx}
                className={`flex gap-2 ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}
              >
                {msg.role === 'assistant' && (
                  <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <Bot size={16} className="text-indigo-600" />
                  </div>
                )}

                <div
                  className={`max-w-[80%] p-3 rounded-xl text-sm ${
                    msg.role === 'user'
                      ? 'bg-indigo-600 text-white rounded-br-none'
                      : msg.content === 'analysis'
                        ? 'bg-slate-50 text-slate-700 rounded-bl-none w-full max-w-full'
                        : 'bg-slate-100 text-slate-700 rounded-bl-none'
                  }`}
                >
                  {/* ⭐ RENDER ANALYSIS DANS CHAT */}
                  {msg.content === 'analysis' ? (
                    <div>
                      {msg.ats_score && renderAtsScore(msg.ats_score)}
                      {msg.sections && msg.sections.map((section, i) => 
                        renderAnalysisSection(section, i)
                      )}
                    </div>
                  ) : (
                    <div className="whitespace-pre-wrap">{msg.content}</div>
                  )}
                </div>

                {msg.role === 'user' && (
                  <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center flex-shrink-0">
                    <User size={16} className="text-blue-600" />
                  </div>
                )}
              </div>
            ))}

            {chatLoading && (
              <div className="flex gap-2 justify-start">
                <div className="w-8 h-8 bg-indigo-100 rounded-full flex items-center justify-center">
                  <Bot size={16} className="text-indigo-600 animate-bounce" />
                </div>
                <div className="bg-slate-100 p-3 rounded-xl rounded-bl-none">
                  <Loader size={16} className="animate-spin text-indigo-600" />
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>

          {/* Input */}
          <div className="border-t border-slate-200 p-3">
            <div className="flex gap-2">
              <input
                type="text"
                value={chatInput}
                onChange={(e) => setChatInput(e.target.value)}
                onKeyPress={(e) => e.key === 'Enter' && sendChatMessage()}
                placeholder="Posez votre question..."
                className="flex-1 px-3 py-2 border border-slate-200 rounded-xl text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500"
                disabled={chatLoading}
              />
              <button
                onClick={sendChatMessage}
                disabled={chatLoading || !chatInput.trim()}
                className="px-3 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-700 disabled:opacity-50 transition-colors"
              >
                <Send size={16} />
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default FormulaireCandidat;