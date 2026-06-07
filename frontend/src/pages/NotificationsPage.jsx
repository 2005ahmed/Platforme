import { useState, useEffect } from "react";
import TopLayout from "../components/TopLayout";
import api from "../services/api";
import { 
  Bell, Mail, Clock, Check, Trash2, ChevronDown,
  AlertCircle 
} from "lucide-react";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);
  const [settings, setSettings] = useState(null);
  const [loading, setLoading] = useState({ notifs: false, settings: false });
  const [saved, setSaved] = useState(false);

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
        follow_up_frequency: 7
      });
    }
    setLoading(p => ({ ...p, settings: false }));
  };

  useEffect(() => {
    loadNotifications();
    loadSettings();
  }, []);

  // ========== ACTIONS ==========
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

  const saveSettings = async () => {
    try {
      await api.put("/settings/reminders", settings);
      setSaved(true);
      setTimeout(() => setSaved(false), 3000);
    } catch (e) { console.error("Erreur sauvegarde:", e); }
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
      <div className="max-w-3xl mx-auto space-y-8">
        
        {/* ===== HEADER ===== */}
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

        {/* ===== NOTIFICATIONS LIST ===== */}
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
    </TopLayout>
  );
}