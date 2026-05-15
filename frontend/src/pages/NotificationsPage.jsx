import { useState } from "react";
import Layout from "../components/TopLayout";
import api from "../services/api";

export default function NotificationsPage() {
  const [items, setItems] = useState([]);

  const load = async () => {
  const res = await api.get("/notifications/");
  setItems(res.data || []);
};

const markRead = async (id) => {
  await api.patch(`/notifications/${id}/read`);
  load();
};

const readAll = async () => {
  await api.patch("/notifications/read-all");
  load();
};

  return (
    <Layout title="Notifications">
      <div className="flex justify-end mb-4">
        <button onClick={readAll} className="px-4 py-2 rounded bg-slate-900 border border-slate-800 hover:bg-slate-800">
          Tout marquer comme lu
        </button>
      </div>

      <div className="space-y-2">
        {items.map((n) => (
          <div key={n.id} className="p-4 rounded bg-slate-900 border border-slate-800 flex justify-between">
            <div>
              <div className="font-semibold">
                {n.type.toUpperCase()} {n.is_read ? "✅" : "🟡"}
              </div>
              <div className="text-slate-300">{n.message}</div>
              <div className="text-slate-500 text-sm">{n.created_at}</div>
            </div>

            {!n.is_read && (
              <button onClick={() => markRead(n.id)} className="text-indigo-400 hover:text-indigo-300">
                Mark read
              </button>
            )}
          </div>
        ))}

        {!items.length && <p className="text-slate-500">No notifications yet.</p>}
      </div>
    </Layout>
  );
}