import { useEffect, useMemo, useState } from "react";
import TopLayout from "../components/TopLayout";
import api from "../services/api";
import StatCard2 from "../components/StatCard";
import StatusBadge from "../components/StatusBadge";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  Tooltip,
  Legend,
} from "chart.js";
import { Bar } from "react-chartjs-2";

ChartJS.register(CategoryScale, LinearScale, BarElement, Tooltip, Legend);

export default function DashboardPage() {
  const [apps, setApps] = useState([]);

  const load = async () => {
  try {
    const token = localStorage.getItem("token");
    console.log("TOKEN:", token);

    const res = await api.get("/applications");

    console.log(res.data);

    setApps(res.data || []);
  } catch (err) {
    console.log("ERROR:", err.response?.data);
    console.log(err.response?.status);
  }
};

  useEffect(() => { load(); }, []);

  const stats = useMemo(() => {
    const total = apps.length;

    const byStatus = apps.reduce((acc, a) => {
      const s = a.status || "En attente";
      acc[s] = (acc[s] || 0) + 1;
      return acc;
    }, {});

    const pending = byStatus["En attente"] || 0;
    const interview = byStatus["Entretien"] || 0;
    const accepted = byStatus["Acceptée"] || 0;
    const refused = byStatus["Refusée"] || 0;

    const responded = accepted + refused + interview;
    const responseRate = total ? Math.round((responded / total) * 100) : 0;

    // Monthly stats
    const byMonth = {};
    apps.forEach((a) => {
      const d = a.applied_date || a.created_at;
      if (!d) return;
      const dt = new Date(d);
      if (Number.isNaN(dt.getTime())) return;
      const key = `${dt.getFullYear()}-${String(dt.getMonth() + 1).padStart(2, "0")}`;
      byMonth[key] = (byMonth[key] || 0) + 1;
    });

    const months = Object.keys(byMonth).sort();
    const values = months.map((m) => byMonth[m]);

    return { total, pending, interview, accepted, refused, responseRate, months, values };
  }, [apps]);

  const barData = {
  labels: stats.months.length
    ? stats.months
    : ["Jan", "Feb", "Mar", "Apr"],

  datasets: [
    {
      label: "Candidatures",

      data: stats.values.length
        ? stats.values
        : [4, 7, 3, 9],

      backgroundColor: [
        "#6366f1",
        "#8b5cf6",
        "#06b6d4",
        "#22c55e",
      ],

      borderRadius: 14,
      borderSkipped: false,
      maxBarThickness: 55,
    },
  ],
};
  const barOptions = {
  responsive: true,
  maintainAspectRatio: false,

  plugins: {
    legend: {
      display: false,
    },

    tooltip: {
      backgroundColor: "#111827",
      padding: 12,
      cornerRadius: 10,
    },
  },

  scales: {
    x: {
      grid: {
        display: false,
      },
      ticks: {
        color: "#64748b",
      },
    },

    y: {
      beginAtZero: true,

      ticks: {
        stepSize: 1,
        color: "#64748b",
      },

      grid: {
        color: "#e2e8f0",
      },
    },
  },
};

  return (
    <TopLayout>
      <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
        <div className="text-slate-900 font-semibold mb-4">Vue d’ensemble</div>

        {/* Cards row */}
        <div className="grid gap-4 md:grid-cols-4">
          <StatCard2 label="Candidatures envoyées" value={stats.total} sub="Total enregistrées" />
          <StatCard2 label="En attente" value={stats.pending} sub="Sans réponse" />
          <StatCard2 label="Entretiens programmés" value={stats.interview} sub="À préparer" />
          <StatCard2 label="Taux de réponse" value={`${stats.responseRate}%`} sub="Entretien + Acceptée + Refusée" />
        </div>

        {/* Chart box */}
        <div className="mt-6 bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
          <div className="flex items-center justify-between mb-4">
            <h2 className="font-semibold text-slate-900">
              📈 Statistiques mensuelles
              </h2>
              </div>
              <div className="h-[320px]">
                <Bar data={barData} options={barOptions} />
                </div>
                </div>

        {/* Recent list */}
        <div className="mt-6">
          <div className="font-semibold text-slate-900 mb-3">Candidatures récentes</div>

          <div className="space-y-3">
            {apps.slice(0, 4).map((a) => (
              <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between">
                <div>
                  <div className="font-semibold text-slate-900">{a.job_title}</div>
                  <div className="text-sm text-slate-500">{a.company}</div>
                </div>
                <StatusBadge status={a.status} />
              </div>
            ))}

            {!apps.length && (
              <div className="text-sm text-slate-500">No applications yet.</div>
            )}
          </div>
        </div>
      </div>
    </TopLayout>
  );
}