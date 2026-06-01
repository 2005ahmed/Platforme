
import { useEffect, useState } from "react";
import Layout from "../components/TopLayout";
import api from "../services/api";

import {
  Bell,
  Check,
  CheckCheck,
  Clock,
  Trash2,
} from "lucide-react";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  const load = async () => {
    try {
      const res = await api.get("/notifications/");
      setItems(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const markRead = async (id) => {
    try {
      await api.patch(`/notifications/${id}/read`);
      load();
    } catch (err) {
      console.log(err);
    }
  };

  const readAll = async () => {
    try {
      await api.patch("/notifications/read-all");
      load();
    } catch (err) {
      console.log(err);
    }
  };

  const deleteNotification = async (id) => {
    try {
      await api.delete(`/notifications/${id}`);
      load();
    } catch (err) {
      console.log(err);
    }
  };

  // Compter non lues
  const unreadCount = items.filter((n) => !n.is_read).length;

  return (
    <Layout title="Notifications">
      {/* HEADER */}
      <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm mb-6">
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4">
          <div className="flex items-center gap-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
              <Bell className="text-indigo-600" size={28} />
            </div>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Notifications
              </h1>
              <p className="text-slate-500 text-sm mt-1">
                {unreadCount > 0
                  ? `${unreadCount} notification${unreadCount > 1 ? "s" : ""} non lue${unreadCount > 1 ? "s" : ""}`
                  : "Toutes les notifications sont lues"}
              </p>
            </div>
          </div>

          {unreadCount > 0 && (
            <button
              onClick={readAll}
              className="flex items-center gap-2 px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg transition-colors"
            >
              <CheckCheck size={18} />
              Tout marquer comme lu
            </button>
          )}
        </div>
      </div>

      {/* NOTIFICATIONS LIST */}
      <div className="space-y-4">
        {items.map((n) => (
          <div
            key={n.id}
            className={`bg-white border rounded-3xl p-6 shadow-sm transition-all hover:shadow-md ${
              n.is_read
                ? "border-slate-200 opacity-75"
                : "border-indigo-200 bg-indigo-50/30"
            }`}
          >
            <div className="flex flex-col md:flex-row md:items-start md:justify-between gap-4">
              {/* LEFT: Icon + Content */}
              <div className="flex items-start gap-4">
                {/* Status Icon */}
                <div
                  className={`h-12 w-12 rounded-2xl flex items-center justify-center shrink-0 ${
                    n.is_read
                      ? "bg-slate-100 text-slate-400"
                      : "bg-indigo-100 text-indigo-600"
                  }`}
                >
                  {n.is_read ? (
                    <Check size={20} />
                  ) : (
                    <Bell size={20} />
                  )}
                </div>

                {/* Content */}
                <div className="space-y-2">
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-bold uppercase tracking-wider px-3 py-1 rounded-full ${
                        n.is_read
                          ? "bg-slate-100 text-slate-500"
                          : "bg-indigo-100 text-indigo-700"
                      }`}
                    >
                      {n.type}
                    </span>
                    {!n.is_read && (
                      <span className="h-2 w-2 rounded-full bg-indigo-500 animate-pulse" />
                    )}
                  </div>

                  <p
                    className={`text-base ${
                      n.is_read
                        ? "text-slate-500"
                        : "text-slate-800 font-medium"
                    }`}
                  >
                    {n.message}
                  </p>

                  <div className="flex items-center gap-1 text-slate-400 text-sm">
                    <Clock size={14} />
                    {n.created_at}
                  </div>
                </div>
              </div>

              {/* RIGHT: Actions */}
              <div className="flex items-center gap-2 shrink-0">
                {!n.is_read && (
                  <button
                    onClick={() => markRead(n.id)}
                    className="flex items-center gap-1 px-4 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-sm font-medium transition-colors"
                  >
                    <Check size={16} />
                    Marquer comme lu
                  </button>
                )}

                <button
                  onClick={() => deleteNotification(n.id)}
                  className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition-colors"
                >
                  <Trash2 size={16} />
                  Supprimer
                </button>
              </div>
            </div>
          </div>
        ))}

        {/* EMPTY STATE */}
        {!items.length && (
          <div className="bg-white border border-slate-200 rounded-3xl p-12 shadow-sm text-center">
            <div className="h-20 w-20 rounded-3xl bg-slate-100 flex items-center justify-center mx-auto mb-4">
              <Bell className="text-slate-400" size={40} />
            </div>
            <h3 className="text-xl font-bold text-slate-900 mb-2">
              Aucune notification
            </h3>
            <p className="text-slate-500">
              Vous n&apos;avez pas encore reçu de notifications.
            </p>
          </div>
        )}
      </div>
    </Layout>
  );
}
