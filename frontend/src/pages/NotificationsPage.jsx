import { useState, useEffect } from "react";
import TopLayout from "../components/TopLayout";
import api from "../services/api";
import { 
  Bell, Mail, Clock, Check, Trash2, ChevronDown,
  AlertCircle, Settings, ChevronRight, Save, X
} from "lucide-react";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState({ notifs: false, settings: false });
  const [saved, setSaved] = useState(false);
  const [activeSection, setActiveSection] = useState("notifications"); // ⭐ "notifications" | "settings"
  const [error, setError] = useState(null);

  // ========== LOAD ==========
  const loadNotifications = async () => {
    setLoading(p => ({ ...p, notifs: true }));
    try {
      const res = await api.get("/notifications/");
      setItems(res.data);
    } catch (e) {
      console.error("Erreur chargement notifications:", e);
    }
    setLoading(p => ({ ...p, notifs: false }));
  };

  const loadSettings = async () => {
    setLoading(p => ({ ...p, settings: true }));
    try {
      const res = await api.get("/settings/reminders");
      setSettings(res.data);
    } catch (e) {
      console.error("Erreur chargement paramètres:", e);
      // Fallback
      setSettings({
        enable_email_reminders: true,
        enable_in_app_reminders: true,
        follow_up_frequency: 7,
        interview_prep_reminder: 1,
        no_response_reminder: 14,
        weekly_digest: true,
        digest_day: "monday",
        reminder_time: "09:00",
        timezone: "Europe/Paris",
        include_ai_tips: true
      });
    }
    setLoading(p => ({ ...p, settings: false }));
  };

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  // ========== ACTIONS NOTIFICATIONS ==========
  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  const markAllRead = async () => {
    try {
      await api.patch("/notifications/read-all");
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      loadNotifications();
    } catch (e) { console.error(e); }
  };

  // ========== ACTIONS SETTINGS ==========
  const saveSettings = async () => {
    try {
      await api.put("/settings/reminders", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { 
      console.error("Erreur sauvegarde:", e);
      setError("❌ Erreur lors de l'enregistrement");
    }
  };

  const updateSetting = (field, value) => {
    setSettings(prev => ({ ...prev, [field]: value }));
  };

  // ========== HELPERS ==========
  const unreadCount = items.filter(n => !n.is_read).length;

  const getIcon = (type) => {
    switch (type) {
      case "reminder": return <Clock size={18} className="text-amber-500" />;
      case "response": return <Mail size={18} className="text-blue-500" />;
      case "interview": return <Check size={18} className="text-emerald-500" />;
      default: return <Bell size={18} className="text-slate-400" />;
    }
  };

  const getBgColor = (type, isRead) => {
    if (isRead) return "bg-white border-slate-200";
    switch (type) {
      case "reminder": return "bg-amber-50/80 border-amber-200";
      case "response": return "bg-blue-50/80 border-blue-200";
      case "interview": return "bg-emerald-50/80 border-emerald-200";
      default: return "bg-white border-slate-200";
    }
  };

  const getLeftBorder = (type) => {
    switch (type) {
      case "reminder": return "border-l-4 border-l-amber-400";
      case "response": return "border-l-4 border-l-blue-400";
      case "interview": return "border-l-4 border-l-emerald-400";
      default: return "border-l-4 border-l-slate-300";
    }
  };

  // ========== RENDER ==========
  return (
    <TopLayout title="Notifications">
      <div className="max-w-4xl mx-auto">
        
        {/* ===== TABS / NAVIGATION ===== */}
        <div className="flex gap-2 mb-6 bg-slate-100 p-1 rounded-2xl w-fit">
          <button
            onClick={() => setActiveSection("notifications")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === "notifications"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Bell size={18} />
            Notifications
            {unreadCount > 0 && (
              <span className="ml-1 px-2 py-0.5 bg-amber-500 text-white rounded-full text-xs">
                {unreadCount}
              </span>
            )}
          </button>
          
          <button
            onClick={() => setActiveSection("settings")}
            className={`flex items-center gap-2 px-5 py-2.5 rounded-xl text-sm font-medium transition-all ${
              activeSection === "settings"
                ? "bg-white text-indigo-600 shadow-sm"
                : "text-slate-500 hover:text-slate-700"
            }`}
          >
            <Settings size={18} />
            Paramètres
          </button>
        </div>

        {/* ===== SECTION 1: NOTIFICATIONS ===== */}
        {activeSection === "notifications" && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-2">
                <Bell size={20} className="text-amber-500" />
                <h1 className="text-xl font-bold text-slate-900">Notifications</h1>
                {unreadCount > 0 && (
                  <span className="bg-amber-500 text-white text-xs px-2 py-0.5 rounded-full font-medium">
                    {unreadCount}
                  </span>
                )}
              </div>
              {unreadCount > 0 && (
                <button
                  onClick={markAllRead}
                  className="text-sm text-slate-500 hover:text-indigo-600 font-medium transition-colors"
                >
                  Tout marquer comme lu
                </button>
              )}
            </div>

            {/* Notifications List */}
            <div className="space-y-3">
              {loading.notifs ? (
                <div className="text-center py-12 text-slate-400">Chargement...</div>
              ) : items.length === 0 ? (
                <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                  <Bell size={48} className="text-slate-200 mx-auto mb-3" />
                  <p className="text-slate-500">Aucune notification</p>
                  <p className="text-sm text-slate-400 mt-1">
                    Les rappels et réponses apparaîtront ici
                  </p>
                </div>
              ) : (
                items.map(n => (
                  <div
                    key={n.id}
                    className={`relative border rounded-2xl p-4 transition-all hover:shadow-md ${getBgColor(n.type, n.is_read)} ${getLeftBorder(n.type)}`}
                  >
                    <div className="flex items-start gap-3">
                      {/* Icon circle */}
                      <div className={`p-2 rounded-xl shrink-0 ${n.is_read ? 'bg-slate-100' : 'bg-white shadow-sm'}`}>
                        {getIcon(n.type)}
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-start justify-between gap-2">
                          <div>
                            <h3 className={`font-semibold text-sm ${n.is_read ? 'text-slate-600' : 'text-slate-900'}`}>
                              {n.title || (n.type === "reminder" ? "Rappel de relance" : n.type === "response" ? "Nouvelle réponse reçue" : "Notification")}
                            </h3>
                            <p className={`text-sm mt-1 leading-relaxed ${n.is_read ? 'text-slate-400' : 'text-slate-600'}`}>
                              {n.message}
                            </p>
                            <p className="text-xs text-slate-400 mt-2">
                              {n.created_at ? new Date(n.created_at).toLocaleDateString('fr-FR', {
                                day: 'numeric',
                                month: 'short',
                                hour: '2-digit',
                                minute: '2-digit'
                              }) : ''}
                            </p>
                          </div>

                          {/* Actions */}
                          <div className="flex items-center gap-1 shrink-0">
                            {!n.is_read && (
                              <button
                                onClick={() => markRead(n.id)}
                                className="text-xs bg-white border border-slate-200 text-slate-500 px-3 py-1.5 rounded-lg hover:bg-slate-50 hover:text-slate-700 transition-colors"
                              >
                                Marquer comme lu
                              </button>
                            )}
                            {n.type === "response" && (
                              <button className="text-xs bg-emerald-50 text-emerald-700 border border-emerald-200 px-3 py-1.5 rounded-lg hover:bg-emerald-100 transition-colors">
                                Voir
                              </button>
                            )}
                            {n.type === "interview" && (
                              <button className="text-xs bg-blue-50 text-blue-700 border border-blue-200 px-3 py-1.5 rounded-lg hover:bg-blue-100 transition-colors">
                                Calendrier
                              </button>
                            )}
                            <button
                              onClick={() => deleteNotification(n.id)}
                              className="p-1.5 text-slate-300 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"
                            >
                              <Trash2 size={14} />
                            </button>
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </div>
        )}

        {/* ===== SECTION 2: PARAMÈTRES DES RAPPELS ===== */}
        {activeSection === "settings" && (
          <div className="space-y-6">
            
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
              <Settings size={20} className="text-indigo-600" />
              <h1 className="text-xl font-bold text-slate-900">Paramètres des rappels</h1>
            </div>

            {loading.settings ? (
              <div className="text-center py-12 text-slate-400">Chargement...</div>
            ) : !settings ? (
              <div className="text-center py-12 bg-white border border-slate-200 rounded-2xl">
                <AlertCircle size={48} className="text-slate-200 mx-auto mb-3" />
                <p className="text-slate-500">Impossible de charger les paramètres</p>
              </div>
            ) : (
              <div className="space-y-4 max-w-2xl">
                
                {/* Rappel de relance */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Rappel de relance après candidature</p>
                    <p className="text-xs text-slate-500">Délai avant notification de relance</p>
                  </div>
                  <select
                    value={settings.follow_up_frequency || 7}
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
                    value={settings.interview_prep_reminder || 1}
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
                    value={settings.no_response_reminder || 14}
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
                      value={settings.digest_day || "monday"}
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
                      onClick={() => updateSetting("weekly_digest", !settings.weekly_digest)}
                      className={`w-12 h-6 rounded-full transition-colors ${settings.weekly_digest ? 'bg-indigo-600' : 'bg-slate-300'}`}
                    >
                      <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.weekly_digest ? 'translate-x-6' : 'translate-x-1'}`} />
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
                    value={settings.reminder_time || "09:00"}
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
                    value={settings.timezone || "Europe/Paris"}
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
                    onClick={() => updateSetting("include_ai_tips", !settings.include_ai_tips)}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.include_ai_tips ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.include_ai_tips ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Email notifications */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Notifications par email</p>
                    <p className="text-xs text-slate-500">Recevoir les rappels sur votre email</p>
                  </div>
                  <button
                    onClick={() => updateSetting("enable_email_reminders", !settings.enable_email_reminders)}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.enable_email_reminders ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.enable_email_reminders ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* In-app notifications */}
                <div className="flex items-center justify-between p-4 bg-white rounded-xl border border-slate-200">
                  <div>
                    <p className="font-medium text-slate-900">Notifications in-app</p>
                    <p className="text-xs text-slate-500">Recevoir les rappels dans l'application</p>
                  </div>
                  <button
                    onClick={() => updateSetting("enable_in_app_reminders", !settings.enable_in_app_reminders)}
                    className={`w-12 h-6 rounded-full transition-colors ${settings.enable_in_app_reminders ? 'bg-indigo-600' : 'bg-slate-300'}`}
                  >
                    <div className={`w-5 h-5 bg-white rounded-full transition-transform ${settings.enable_in_app_reminders ? 'translate-x-6' : 'translate-x-1'}`} />
                  </button>
                </div>

                {/* Save button */}
                <button
                  onClick={saveSettings}
                  className="w-full py-3 bg-indigo-600 text-white rounded-xl font-semibold hover:bg-indigo-700 transition-colors flex items-center justify-center gap-2"
                >
                  <Save size={18} />
                  Enregistrer les paramètres
                </button>

                {/* Saved message */}
                {saved && (
                  <div className="p-3 bg-green-50 border border-green-200 rounded-xl text-green-700 text-sm flex items-center gap-2">
                    <Check size={16} />
                    Paramètres enregistrés avec succès!
                  </div>
                )}
              </div>
            )}
          </div>
        )}

      </div>
    </TopLayout>
  );
}