import { useEffect, useState } from "react";
import TopLayout from "../components/TopLayout";
import api from "../services/api";

import {
  Building2,
  Mail,
  CheckCircle,
  XCircle,
  Clock,
  Send,
  Search,
  Eye,
  Download,
  X,
  Inbox,
  History,
  Settings,
  Bell,
  ChevronRight
} from "lucide-react";

export default function RecruiterPage() {
  // ========== STATE ==========
  const [applications, setApplications] = useState([]);
  const [filtered, setFiltered] = useState([]);
  const [search, setSearch] = useState("");
  const [statusFilter, setStatusFilter] = useState("Tous");
  const [selectedApp, setSelectedApp] = useState(null);
  const [notificationMsg, setNotificationMsg] = useState("");
  const [showNotifModal, setShowNotifModal] = useState(false);
  const [showEmailModal, setShowEmailModal] = useState(false);
  const [emailCompany, setEmailCompany] = useState("");
  const [selectedCV, setSelectedCV] = useState(null);
  const [showCVModal, setShowCVModal] = useState(false);
  const [selectedCandidate, setSelectedCandidate] = useState(null);
  const [emailHistory, setEmailHistory] = useState([]);
  const [activeTab, setActiveTab] = useState("applications");
  const [historyLoading, setHistoryLoading] = useState(false);

  // ⭐ SETTINGS STATE
  const [reminderSettings, setReminderSettings] = useState({
    follow_up_frequency: 7,
    interview_prep_reminder: 1,
    no_response_reminder: 14,
    weekly_digest: true,
    digest_day: "monday",
    reminder_time: "09:00",
    timezone: "Europe/Paris",
    include_ai_tips: true,
    enable_email_reminders: true,
    enable_in_app_reminders: true
  });
  const [settingsLoading, setSettingsLoading] = useState(false);

  const BACKEND_URL = "http://localhost:5000";

  // ========== LOAD FUNCTIONS ==========
  const load = async () => {
    try {
      const res = await api.get("/recruiter/applications");
      setApplications(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  const loadHistory = async () => {
    setHistoryLoading(true);
    try {
      const res = await api.get("/recruiter/email-history");
      setEmailHistory(res.data || []);
    } catch (err) {
      console.log(err);
    } finally {
      setHistoryLoading(false);
    }
  };

  const loadSettings = async () => {
    try {
      const res = await api.get("/settings/reminders");
      if (res.data) setReminderSettings(res.data);
    } catch (err) {
      console.log("Error loading settings:", err);
    }
  };

  // ========== TAB SWITCH ==========
  const switchTab = (tab) => {
    setActiveTab(tab);
    if (tab === "history") loadHistory();
    if (tab === "settings") loadSettings();
  };

  // ========== CV VIEW ==========
  const viewCV = (candidate) => {
    if (!candidate) {
      alert("Erreur: Candidat non défini");
      return;
    }
    if (!candidate.cv_filename) {
      alert("Ce candidat n'a pas de CV uploadé");
      return;
    }
    setSelectedCV(candidate.cv_filename);
    setSelectedCandidate(candidate);
    setShowCVModal(true);
  };

  const closeModal = () => {
    setShowCVModal(false);
    setSelectedCV(null);
    setSelectedCandidate(null);
  };

  // ========== ACTIONS ==========
  const updateStatus = async (appId, newStatus) => {
    try {
      await api.patch(`/recruiter/applications/${appId}/status`, {
        status: newStatus,
      });
      load();
    } catch (err) {
      console.log(err);
    }
  };

  const sendNotification = async () => {
    if (!selectedApp || !notificationMsg) return;
    try {
      await api.post("/recruiter/send-notification", {
        candidate_id: selectedApp.candidate.id,
        message: notificationMsg,
      });
      setShowNotifModal(false);
      setNotificationMsg("");
      setSelectedApp(null);
      alert("Notification envoyée!");
    } catch (err) {
      console.log(err);
    }
  };

  const sendEmail = async () => {
    if (!selectedApp) return;
    try {
      await api.post("/recruiter/send-email", {
        candidate_id: selectedApp.candidate.id,
        company: selectedApp.company,
      });
      setShowEmailModal(false);
      setEmailCompany("");
      setSelectedApp(null);
      alert("✅ Email envoyé avec succès!");
    } catch (err) {
      console.log("Error:", err);
      alert("❌ Erreur lors de l'envoi de l'email");
    }
  };

  // ⭐ SAVE SETTINGS
  const saveSettings = async () => {
    setSettingsLoading(true);
    try {
      await api.put("/settings/reminders", reminderSettings);
      alert("✅ Paramètres enregistrés!");
    } catch (err) {
      console.log("Error saving settings:", err);
      alert("❌ Erreur lors de l'enregistrement");
    } finally {
      setSettingsLoading(false);
    }
  };

  const updateSetting = (key, value) => {
    setReminderSettings(prev => ({ ...prev, [key]: value }));
  };

  // ========== EFFECTS ==========
  useEffect(() => {
    load();
  }, []);

  useEffect(() => {
    let result = applications;
    if (search) {
      result = result.filter(
        (a) =>
          a.company?.toLowerCase().includes(search.toLowerCase()) ||
          a.job_title?.toLowerCase().includes(search.toLowerCase()) ||
          a.candidate?.full_name?.toLowerCase().includes(search.toLowerCase())
      );
    }
    if (statusFilter !== "Tous") {
      result = result.filter((a) => a.status === statusFilter);
    }
    setFiltered(result);
  }, [search, statusFilter, applications]);

  // ========== STYLES ==========
  const statusStyle = (s) => {
    switch (s) {
      case "Acceptée": return "bg-green-100 text-green-700 border-green-200";
      case "Refusée": return "bg-red-100 text-red-700 border-red-200";
      case "Entretien": return "bg-blue-100 text-blue-700 border-blue-200";
      default: return "bg-orange-100 text-orange-700 border-orange-200";
    }
  };

  const StatusIcon = ({ status }) => {
    switch (status) {
      case "Acceptée": return <CheckCircle size={16} className="text-green-600" />;
      case "Refusée": return <XCircle size={16} className="text-red-600" />;
      case "Entretien": return <Clock size={16} className="text-blue-600" />;
      default: return <Clock size={16} className="text-orange-600" />;
    }
  };

  // ========== RENDER ==========
  return (
    <TopLayout title="Recruiter Panel">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

        {/* HEADER */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              {activeTab === "applications" && "Gestion des Candidatures"}
              {activeTab === "history" && "Historique des Emails"}
              {activeTab === "settings" && "Paramètres des Rappels"}
            </h1>
            <p className="text-slate-500 text-sm mt-1">
              {activeTab === "applications" && "Consultez et gérez toutes les candidatures"}
              {activeTab === "history" && "Suivez les emails envoyés aux candidats"}
              {activeTab === "settings" && "Configurez les rappels et notifications"}
            </p>
          </div>
        </div>

        {/* TABS */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => switchTab("applications")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "applications"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Inbox size={18} />
            Candidatures
            <span className="ml-1 px-2 py-0.5 bg-indigo-100 text-indigo-700 rounded-full text-xs">
              {applications.length}
            </span>
          </button>
          
          <button
            onClick={() => switchTab("history")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "history"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <History size={18} />
            Historique Emails
            <span className="ml-1 px-2 py-0.5 bg-slate-200 text-slate-600 rounded-full text-xs">
              {emailHistory.length}
            </span>
          </button>

          <button
            onClick={() => switchTab("settings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeTab === "settings"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Settings size={18} />
            Paramètres
          </button>
        </div>

        {/* ========== TAB: APPLICATIONS ========== */}
        {activeTab === "applications" && (
          <>
            {/* SEARCH + FILTER */}
            <div className="flex flex-col md:flex-row gap-3 mb-6">
              <div className="relative flex-1">
                <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher entreprise, poste ou candidat..."
                  className="w-full pl-10 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50"
                />
              </div>
              <select
                value={statusFilter}
                onChange={(e) => setStatusFilter(e.target.value)}
                className="px-4 py-3 rounded-2xl border border-slate-200 bg-white"
              >
                <option value="Tous">Tous les statuts</option>
                <option value="En attente">En attente</option>
                <option value="Entretien">Entretien</option>
                <option value="Acceptée">Acceptée</option>
                <option value="Refusée">Refusée</option>
              </select>
            </div>

            {/* TABLE */}
            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="text-left py-3 px-4">Candidat</th>
                    <th className="text-left py-3 px-4">Poste</th>
                    <th className="text-left py-3 px-4">Entreprise</th>
                    <th className="text-left py-3 px-4">Status</th>
                    <th className="text-left py-3 px-4">Date</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filtered.map((app) => (
                    <tr key={app.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {app.candidate?.full_name?.split(" ").map((n) => n[0]).join("").slice(0, 2).toUpperCase() || "U"}
                          </div>
                          <div>
                            <p className="font-medium text-slate-900">{app.candidate?.full_name || "Unknown"}</p>
                            <p className="text-xs text-slate-500">{app.candidate?.email}</p>
                          </div>
                        </div>
                      </td>
                      <td className="py-4 px-4">
                        <div className="flex items-center gap-2">
                          <Building2 size={16} className="text-slate-400" />
                          <span className="text-slate-700">{app.job_title}</span>
                        </div>
                      </td>
                      <td className="py-4 px-4 text-slate-700">{app.company}</td>
                      <td className="py-4 px-4">
                        <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium border ${statusStyle(app.status)}`}>
                          <StatusIcon status={app.status} />
                          {app.status}
                        </span>
                      </td>
                      <td className="py-4 px-4 text-slate-500 text-sm">
                        {app.applied_date || app.created_at?.slice(0, 10)}
                      </td>
                      <td className="py-4 px-4 text-right">
                        <div className="flex items-center justify-end gap-2">
                          <select
                            value={app.status}
                            onChange={(e) => updateStatus(app.id, e.target.value)}
                            className="px-3 py-2 rounded-xl border border-slate-200 bg-white text-sm"
                          >
                            <option>En attente</option>
                            <option>Entretien</option>
                            <option>Acceptée</option>
                            <option>Refusée</option>
                          </select>
                          <button
                            onClick={() => { setSelectedApp(app); setShowNotifModal(true); }}
                            className="p-2 rounded-xl bg-blue-50 text-blue-600 hover:bg-blue-100"
                            title="Envoyer notification"
                          >
                            <Send size={16} />
                          </button>
                          <button
                            onClick={() => { setSelectedApp(app); setShowEmailModal(true); }}
                            className="p-2 rounded-xl bg-green-50 text-green-600 hover:bg-green-100"
                            title="Envoyer email de relance"
                          >
                            <Mail size={16} />
                          </button>
                          {app.candidate?.cv_filename && (
                            <button
                              onClick={() => viewCV(app.candidate)}
                              className="p-2 rounded-xl bg-purple-50 text-purple-600 hover:bg-purple-100"
                              title="Voir CV"
                            >
                              <Eye size={16} />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))}
                  {!filtered.length && (
                    <tr>
                      <td colSpan="6" className="py-10 text-center text-slate-500">
                        Aucune candidature trouvée.
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </>
        )}

        {/* ========== TAB: EMAIL HISTORY ========== */}
        {activeTab === "history" && (
          <>
            {historyLoading ? (
              <div className="text-center py-10 text-slate-500">
                <div className="animate-spin h-8 w-8 border-4 border-indigo-600 border-t-transparent rounded-full mx-auto mb-4"></div>
                Chargement...
              </div>
            ) : emailHistory.length === 0 ? (
              <div className="text-center py-10 text-slate-500">
                <History size={48} className="mx-auto mb-4 text-slate-300" />
                <p className="text-lg">Aucun email envoyé</p>
                <p className="text-sm mt-2">Les emails envoyés apparaîtront ici</p>
              </div>
            ) : (
              <div className="overflow-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200 text-slate-500 text-sm">
                      <th className="text-left py-3 px-4">Candidat</th>
                      <th className="text-left py-3 px-4">Entreprise</th>
                      <th className="text-left py-3 px-4">Sujet</th>
                      <th className="text-left py-3 px-4">Status</th>
                      <th className="text-left py-3 px-4">Envoyé le</th>
                      <th className="text-left py-3 px-4">Ouvert le</th>
                    </tr>
                  </thead>
                  <tbody>
                    {emailHistory.map((h) => (
                      <tr key={h.id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-4 px-4">
                          <div className="flex items-center gap-3">
                            <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                              {h.candidate_name?.split(" ").map(n => n[0]).join("").slice(0, 2).toUpperCase()}
                            </div>
                            <div>
                              <p className="font-medium text-slate-900">{h.candidate_name}</p>
                            </div>
                          </div>
                        </td>
                        <td className="py-4 px-4 text-slate-700">{h.company}</td>
                        <td className="py-4 px-4 text-slate-600 text-sm">{h.subject}</td>
                        <td className="py-4 px-4">
                          <span className={`inline-flex items-center gap-1 px-3 py-1 rounded-full text-xs font-medium ${
                            h.status === "opened" ? "bg-green-100 text-green-700" : 
                            h.status === "sent" ? "bg-blue-100 text-blue-700" : "bg-red-100 text-red-700"
                          }`}>
                            {h.status === "opened" ? "✅ Ouvert" : 
                             h.status === "sent" ? "📧 Envoyé" : "❌ Échoué"}
                          </span>
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-sm">
                          {new Date(h.sent_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", year: "numeric", hour: "2-digit", minute: "2-digit" })}
                        </td>
                        <td className="py-4 px-4 text-slate-500 text-sm">
                          {h.opened_at ? (
                            <span className="text-green-600 font-medium">
                              {new Date(h.opened_at).toLocaleString("fr-FR", { day: "2-digit", month: "short", hour: "2-digit", minute: "2-digit" })}
                            </span>
                          ) : (
                            <span className="text-slate-400">—</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}
          </>
        )}

        {/* ========== TAB: SETTINGS ========== */}
        {activeTab === "settings" && (
          <div className="space-y-6 max-w-2xl">
            <h3 className="text-lg font-semibold text-slate-900 flex items-center gap-2">
              <Bell size={20} className="text-indigo-600" />
              Paramètres des rappels
            </h3>
            
            {/* Rappel de relance */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Rappel de relance après candidature</p>
                <p className="text-xs text-slate-500">Délai avant notification de relance</p>
              </div>
              <select
                value={reminderSettings.follow_up_frequency}
                onChange={e => updateSetting("follow_up_frequency", parseInt(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
              >
                <option value={3}>3 jours</option>
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={30}>30 jours</option>
              </select>
            </div>

            {/* Préparation entretien */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Rappel de préparation entretien</p>
                <p className="text-xs text-slate-500">Jours avant l'entretien</p>
              </div>
              <select
                value={reminderSettings.interview_prep_reminder}
                onChange={e => updateSetting("interview_prep_reminder", parseInt(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
              >
                <option value={1}>1 jour</option>
                <option value={2}>2 jours</option>
                <option value={3}>3 jours</option>
                <option value={7}>7 jours</option>
              </select>
            </div>

            {/* Pas de réponse */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Rappel si pas de réponse</p>
                <p className="text-xs text-slate-500">Délai avant notification</p>
              </div>
              <select
                value={reminderSettings.no_response_reminder}
                onChange={e => updateSetting("no_response_reminder", parseInt(e.target.value))}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
              >
                <option value={7}>7 jours</option>
                <option value={14}>14 jours</option>
                <option value={21}>21 jours</option>
                <option value={30}>30 jours</option>
              </select>
            </div>

            {/* Résumé hebdomadaire */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Résumé hebdomadaire</p>
                <p className="text-xs text-slate-500">Recevoir un résumé chaque semaine</p>
              </div>
              <div className="flex items-center gap-3">
                <select
                  value={reminderSettings.digest_day}
                  onChange={e => updateSetting("digest_day", e.target.value)}
                  className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
                >
                  <option value="monday">Lundi</option>
                  <option value="tuesday">Mardi</option>
                  <option value="wednesday">Mercredi</option>
                  <option value="thursday">Jeudi</option>
                  <option value="friday">Vendredi</option>
                </select>
                <button
                  onClick={() => updateSetting("weekly_digest", !reminderSettings.weekly_digest)}
                  className={`w-12 h-6 rounded-full transition-colors ${reminderSettings.weekly_digest ? 'bg-indigo-600' : 'bg-slate-300'}`}
                >
                  <div className={`w-5 h-5 bg-white rounded-full transition-transform ${reminderSettings.weekly_digest ? 'translate-x-6' : 'translate-x-1'}`} />
                </button>
              </div>
            </div>

            {/* Heure des rappels */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Heure des rappels</p>
                <p className="text-xs text-slate-500">Heure d'envoi des notifications</p>
              </div>
              <input
                type="time"
                value={reminderSettings.reminder_time}
                onChange={e => updateSetting("reminder_time", e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
              />
            </div>

            {/* Fuseau horaire */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Fuseau horaire</p>
                <p className="text-xs text-slate-500">Votre zone horaire</p>
              </div>
              <select
                value={reminderSettings.timezone}
                onChange={e => updateSetting("timezone", e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-200 bg-slate-50 text-sm"
              >
                <option value="Europe/Paris">Europe/Paris</option>
                <option value="Europe/London">Europe/London</option>
                <option value="Africa/Casablanca">Africa/Casablanca</option>
                <option value="America/New_York">America/New_York</option>
              </select>
            </div>

            {/* Conseils IA */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Conseils IA</p>
                <p className="text-xs text-slate-500">Inclure des conseils personnalisés</p>
              </div>
              <button
                onClick={() => updateSetting("include_ai_tips", !reminderSettings.include_ai_tips)}
                className={`w-12 h-6 rounded-full transition-colors ${reminderSettings.include_ai_tips ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${reminderSettings.include_ai_tips ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Email notifications */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Notifications par email</p>
                <p className="text-xs text-slate-500">Recevoir les rappels sur votre email</p>
              </div>
              <button
                onClick={() => updateSetting("enable_email_reminders", !reminderSettings.enable_email_reminders)}
                className={`w-12 h-6 rounded-full transition-colors ${reminderSettings.enable_email_reminders ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${reminderSettings.enable_email_reminders ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* In-app notifications */}
            <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
              <div>
                <p className="font-medium text-slate-900">Notifications in-app</p>
                <p className="text-xs text-slate-500">Recevoir les rappels dans l'application</p>
              </div>
              <button
                onClick={() => updateSetting("enable_in_app_reminders", !reminderSettings.enable_in_app_reminders)}
                className={`w-12 h-6 rounded-full transition-colors ${reminderSettings.enable_in_app_reminders ? 'bg-indigo-600' : 'bg-slate-300'}`}
              >
                <div className={`w-5 h-5 bg-white rounded-full transition-transform ${reminderSettings.enable_in_app_reminders ? 'translate-x-6' : 'translate-x-1'}`} />
              </button>
            </div>

            {/* Save button */}
            <button
              onClick={saveSettings}
              disabled={settingsLoading}
              className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors disabled:opacity-50"
            >
              {settingsLoading ? "Enregistrement..." : "Enregistrer les paramètres"}
            </button>
          </div>
        )}

        {/* ========== MODALS ========== */}
        {/* CV MODAL */}
        {showCVModal && selectedCV && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-[9999] p-4" onClick={closeModal}>
            <div className="bg-white w-full max-w-5xl h-[95vh] rounded-3xl p-6 shadow-2xl flex flex-col" onClick={(e) => e.stopPropagation()}>
              <div className="flex items-center justify-between mb-4">
                <div>
                  <h2 className="text-xl font-bold text-slate-900">CV du Candidat</h2>
                  <p className="text-sm text-slate-500">{selectedCandidate?.full_name} — {selectedCV}</p>
                </div>
                <div className="flex gap-2">
                  <a href={`${BACKEND_URL}/uploads/${selectedCV}`} download={selectedCV}
                    className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 text-sm" onClick={(e) => e.stopPropagation()}>
                    <Download size={16} /> Télécharger
                  </a>
                  <button onClick={closeModal} className="p-2 rounded-xl bg-slate-100 text-slate-500 hover:bg-slate-200">
                    <X size={20} />
                  </button>
                </div>
              </div>
              <div className="flex-1 overflow-hidden rounded-xl border border-slate-200 bg-white">
                {selectedCV.endsWith(".pdf") ? (
                  <iframe src={`${BACKEND_URL}/uploads/${selectedCV}`} className="w-full h-full" style={{ border: "none" }} title="CV" />
                ) : (
                  <div className="flex flex-col items-center justify-center h-full py-10">
                    <p className="text-lg text-slate-600 mb-2">{selectedCV}</p>
                    <p className="text-sm text-slate-400 mb-6">Format DOCX — Prévisualisation non disponible</p>
                    <a href={`${BACKEND_URL}/uploads/${selectedCV}`} download={selectedCV}
                      className="flex items-center gap-2 px-6 py-3 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500">
                      <Download size={18} /> Télécharger le CV
                    </a>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

        {/* NOTIFICATION MODAL */}
        {showNotifModal && selectedApp && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Envoyer Notification</h2>
                <button onClick={() => setShowNotifModal(false)} className="text-slate-500 hover:text-black text-xl">✕</button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">À:</p>
                <p className="font-medium text-slate-900">{selectedApp.candidate?.full_name} ({selectedApp.candidate?.email})</p>
              </div>
              <textarea
                value={notificationMsg}
                onChange={(e) => setNotificationMsg(e.target.value)}
                placeholder="Votre message..."
                rows={4}
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 mb-4"
              />
              <button onClick={sendNotification} className="w-full py-3 rounded-2xl bg-blue-600 hover:bg-blue-500 text-white font-semibold">
                Envoyer Notification
              </button>
            </div>
          </div>
        )}

        {/* EMAIL MODAL */}
        {showEmailModal && selectedApp && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">
            <div className="bg-white w-full max-w-lg rounded-3xl p-6 shadow-2xl">
              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">Envoyer Email de Relance</h2>
                <button onClick={() => setShowEmailModal(false)} className="text-slate-500 hover:text-black text-xl">✕</button>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">Candidat:</p>
                <p className="font-medium text-slate-900">{selectedApp.candidate?.full_name} ({selectedApp.candidate?.email})</p>
              </div>
              <div className="mb-4">
                <p className="text-sm text-slate-500 mb-2">Entreprise:</p>
                <p className="font-medium text-slate-900">{selectedApp.company}</p>
              </div>
              <input
                value={emailCompany}
                onChange={(e) => setEmailCompany(e.target.value)}
                placeholder="Message personnalisé (optionnel)..."
                className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 mb-4"
              />
              <button onClick={sendEmail} className="w-full py-3 rounded-2xl bg-green-600 hover:bg-green-500 text-white font-semibold">
                📧 Envoyer Email de Relance
              </button>
            </div>
          </div>
        )}
      </div>
    </TopLayout>
  );
}