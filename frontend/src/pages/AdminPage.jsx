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

import {
  Users,
  Briefcase,
  PieChart,
  Trash2,
  Shield,
  User,
  Search,
  AlertTriangle,
  CheckCircle,
  XCircle,
  Loader2,
} from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  const load = async () => {
    try {
      setLoading(true);
      const [s, u] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
      ]);

      setStats(s.data);
      setUsers(u.data || []);
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // DELETE USER
  const deleteUser = async (userId) => {
    try {
      setMsg("");
      await api.delete(`/admin/users/${userId}`);
      
      // Refresh list
      setUsers(users.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
      setMsg("✅ Utilisateur supprimé");
      
      // Refresh stats
      const s = await api.get("/admin/stats");
      setStats(s.data);
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur lors de la suppression");
    }
  };

  // TOGGLE ADMIN
  const toggleAdmin = async (userId, currentStatus) => {
    try {
      setMsg("");
      await api.patch(`/admin/users/${userId}/role`, {
        is_admin: !currentStatus,
      });
      
      // Refresh list
      setUsers(
        users.map((u) =>
          u.id === userId ? { ...u, is_admin: !currentStatus } : u
        )
      );
      setMsg(`✅ Rôle mis à jour`);
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur lors de la mise à jour");
    }
  };

  // FILTER USERS
  const filteredUsers = users.filter(
    (u) =>
      u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
      u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = useMemo(() => {
    if (!stats?.by_status) return null;

    return {
      labels: Object.keys(stats.by_status),
      datasets: [
        {
          data: Object.values(stats.by_status),
          backgroundColor: [
            "#6366f1",  // indigo - En attente
            "#f59e0b",  // amber - Entretien
            "#22c55e",  // green - Acceptée
            "#ef4444",  // red - Refusée
          ],
          borderWidth: 0,
          hoverOffset: 4,
        },
      ],
    };
  }, [stats]);

  const chartOptions = {
    plugins: {
      legend: {
        position: "bottom",
        labels: {
          padding: 15,
          usePointStyle: true,
          pointStyle: "circle",
        },
      },
    },
    cutout: "65%",
  };

  return (
    <Layout title="Admin Dashboard">
      {loading && !stats ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : !stats ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <>
          {/* MESSAGE */}
          {msg && (
            <div className="mb-4 p-4 rounded-2xl bg-green-50 border border-green-200 text-green-700 font-medium flex items-center gap-2">
              {msg.includes("✅") ? (
                <CheckCircle size={18} />
              ) : (
                <XCircle size={18} />
              )}
              {msg}
            </div>
          )}

          {/* STATS CARDS */}
          <div className="grid md:grid-cols-3 gap-5 mb-6">
            {/* Total Users */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Users className="text-indigo-600" size={28} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total utilisateurs</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.total_users}
                  </p>
                </div>
              </div>
            </div>

            {/* Total Applications */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4">
                <div className="h-14 w-14 rounded-2xl bg-amber-100 flex items-center justify-center">
                  <Briefcase className="text-amber-600" size={28} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Total candidatures</p>
                  <p className="text-3xl font-bold text-slate-900">
                    {stats.total_applications}
                  </p>
                </div>
              </div>
            </div>

            {/* Chart */}
            <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
              <div className="flex items-center gap-4 mb-4">
                <div className="h-14 w-14 rounded-2xl bg-purple-100 flex items-center justify-center">
                  <PieChart className="text-purple-600" size={28} />
                </div>
                <div>
                  <p className="text-slate-500 text-sm">Répartition</p>
                  <p className="text-lg font-bold text-slate-900">
                    Candidatures
                  </p>
                </div>
              </div>
              <div className="w-[200px] mx-auto">
                {chartData ? (
                  <Doughnut data={chartData} options={chartOptions} />
                ) : (
                  <p className="text-slate-500 text-center">No data</p>
                )}
              </div>
            </div>
          </div>

          {/* USERS TABLE */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">
            <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
              <div className="flex items-center gap-4">
                <div className="h-12 w-12 rounded-2xl bg-indigo-100 flex items-center justify-center">
                  <Users className="text-indigo-600" size={24} />
                </div>
                <div>
                  <h2 className="text-xl font-bold text-slate-900">
                    Utilisateurs
                  </h2>
                  <p className="text-slate-500 text-sm">
                    {filteredUsers.length} utilisateur{filteredUsers.length > 1 ? "s" : ""}
                  </p>
                </div>
              </div>

              {/* SEARCH */}
              <div className="relative w-full md:w-72">
                <Search
                  size={18}
                  className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
                />
                <input
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Rechercher..."
                  className="w-full pl-10 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>
            </div>

            <div className="overflow-auto">
              <table className="w-full">
                <thead>
                  <tr className="border-b border-slate-200 text-slate-500 text-sm">
                    <th className="text-left py-3 px-4">ID</th>
                    <th className="text-left py-3 px-4">Utilisateur</th>
                    <th className="text-left py-3 px-4">Email</th>
                    <th className="text-left py-3 px-4">Rôle</th>
                    <th className="text-right py-3 px-4">Actions</th>
                  </tr>
                </thead>

                <tbody>
                  {filteredUsers.map((u) => (
                    <tr
                      key={u.id}
                      className="border-b border-slate-100 hover:bg-slate-50 transition"
                    >
                      <td className="py-4 px-4 text-slate-700 font-mono text-sm">
                        #{u.id}
                      </td>

                      <td className="py-4 px-4">
                        <div className="flex items-center gap-3">
                          <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold text-sm">
                            {u.full_name
                              ?.split(" ")
                              .map((n) => n[0])
                              .join("")
                              .slice(0, 2)
                              .toUpperCase() || "U"}
                          </div>
                          <p className="font-medium text-slate-900">
                            {u.full_name || "User"}
                          </p>
                        </div>
                      </td>

                      <td className="py-4 px-4 text-slate-600">
                        {u.email}
                      </td>

                      <td className="py-4 px-4">
                        <button
                          onClick={() => toggleAdmin(u.id, u.is_admin)}
                          className={`inline-flex items-center gap-1 px-3 py-1.5 rounded-full text-xs font-medium transition-all ${
                            u.is_admin
                              ? "bg-green-100 text-green-700 hover:bg-green-200"
                              : "bg-slate-100 text-slate-600 hover:bg-slate-200"
                          }`}
                        >
                          {u.is_admin ? (
                            <>
                              <Shield size={12} />
                              Admin
                            </>
                          ) : (
                            <>
                              <User size={12} />
                              User
                            </>
                          )}
                        </button>
                      </td>

                      <td className="py-4 px-4 text-right">
                        {deleteConfirm === u.id ? (
                          <div className="flex items-center gap-2 justify-end">
                            <button
                              onClick={() => deleteUser(u.id)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-600 hover:bg-red-700 text-white text-xs font-medium"
                            >
                              <CheckCircle size={14} />
                              Confirmer
                            </button>
                            <button
                              onClick={() => setDeleteConfirm(null)}
                              className="flex items-center gap-1 px-3 py-2 rounded-xl bg-slate-100 hover:bg-slate-200 text-slate-600 text-xs font-medium"
                            >
                              <XCircle size={14} />
                              Annuler
                            </button>
                          </div>
                        ) : (
                          <button
                            onClick={() => setDeleteConfirm(u.id)}
                            className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm font-medium transition-colors"
                          >
                            <Trash2 size={16} />
                            Supprimer
                          </button>
                        )}
                      </td>
                    </tr>
                  ))}

                  {!filteredUsers.length && (
                    <tr>
                      <td
                        colSpan="5"
                        className="py-10 text-center text-slate-500"
                      >
                        <AlertTriangle
                          size={40}
                          className="mx-auto mb-3 text-slate-300"
                        />
                        Aucun utilisateur trouvé
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
