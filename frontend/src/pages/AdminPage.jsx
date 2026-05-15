import { useEffect, useMemo, useState } from "react";
import Layout from "../components/TopLayout";
import api from "../services/api";

import {
  Chart as ChartJS,
  ArcElement,
  Tooltip,
  Legend,
} from "chart.js";

import { Doughnut } from "react-chartjs-2";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);

  const load = async () => {
    try {
      const s = await api.get("/admin/stats");
      const u = await api.get("/admin/users");

      setStats(s.data);
      setUsers(u.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const chartData = useMemo(() => {
    if (!stats?.by_status) return null;

    return {
      labels: Object.keys(stats.by_status),
      datasets: [
        {
          data: Object.values(stats.by_status),
          backgroundColor: [
            "#6366f1",
            "#f59e0b",
            "#22c55e",
            "#ef4444",
          ],
          borderWidth: 0,
        },
      ],
    };
  }, [stats]);

  return (
    <Layout title="Admin Dashboard">
      {!stats ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          {/* cards */}
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-slate-500 text-sm mb-2">
                Total utilisateurs
              </p>

              <p className="text-3xl font-bold text-slate-900">
                {stats.total_users}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-slate-500 text-sm mb-2">
                Total candidatures
              </p>

              <p className="text-3xl font-bold text-slate-900">
                {stats.total_applications}
              </p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <p className="text-slate-500 text-sm mb-4">
                Répartition des candidatures
              </p>

              <div className="w-[220px] mx-auto">
                {chartData ? (
                  <Doughnut data={chartData} />
                ) : (
                  <p className="text-slate-500">No data</p>
                )}
              </div>
            </div>
          </div>

          {/* users table */}
          <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
            <h2 className="text-xl font-semibold text-slate-900 mb-5">
              Utilisateurs
            </h2>

            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="text-left py-3">ID</th>
                    <th className="text-left py-3">Nom</th>
                    <th className="text-left py-3">Email</th>
                    <th className="text-left py-3">Admin</th>
                    <th className="text-right py-3">Action</th>
                  </tr>
                </thead>

                <tbody>
                  {users.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100"
                    >
                      <td className="py-4 text-slate-700">{u.id}</td>

                      <td className="py-4 text-slate-900 font-medium">
                        {u.full_name || "User"}
                      </td>

                      <td className="py-4 text-slate-600">
                        {u.email}
                      </td>

                      <td className="py-4">
                        {u.is_admin ? (
                          <span className="px-3 py-1 rounded-full bg-green-100 text-green-700 text-xs">
                            Admin
                          </span>
                        ) : (
                          <span className="px-3 py-1 rounded-full bg-slate-100 text-slate-600 text-xs">
                            User
                          </span>
                        )}
                      </td>

                      <td className="py-4 text-right">
                        <button className="px-4 py-2 rounded-xl bg-red-500 hover:bg-red-600 text-white text-sm">
                          Delete
                        </button>
                      </td>
                    </tr>
                  ))}

                  {!users.length && (
                    <tr>
                      <td
                        className="py-5 text-slate-500"
                        colSpan="5"
                      >
                        Aucun utilisateur
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </>
      )}
    </Layout>
  );
}