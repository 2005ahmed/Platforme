// RecruiterAnalyticsPage.jsx

import { useEffect, useState, useCallback } from "react";
import TopLayout from "../components/TopLayout";
import api from "../services/api";

// RecruiterAnalyticsPage.jsx
import {
  TrendingUp, TrendingDown,
  Users, FileText, CheckCircle, XCircle, Clock,
  Mail, Eye, ArrowUpRight, ArrowDownRight,
  RefreshCw, Calendar, Activity
} from "lucide-react";

import {
  Chart as ChartJS,
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,        // ⭐ HADI KHASSEK TZIDHA!
  LineElement,         // ⭐ HADI KHASSEK TZIDHA!
  Tooltip,
  Legend,
  Filler,
} from "chart.js";
import { Bar, Doughnut, Line } from "react-chartjs-2";

// ⭐ REGISTER KOLCHI!
ChartJS.register(
  CategoryScale,
  LinearScale,
  BarElement,
  ArcElement,
  PointElement,       // ⭐ HADI!
  LineElement,        // ⭐ HADI!
  Tooltip,
  Legend,
  Filler
);


export default function RecruiterAnalyticsPage() {
  const [stats, setStats] = useState(null);
  const [loading, setLoading] = useState(true);
  const [lastUpdate, setLastUpdate] = useState(null);
  const [autoRefresh, setAutoRefresh] = useState(true);

  // ⭐ LOAD DATA
  const load = useCallback(async () => {
    try {
      const res = await api.get("/recruiter/analytics");
      setStats(res.data);
      setLastUpdate(new Date());
    } catch (err) {
      console.log(err);
    } finally {
      setLoading(false);
    }
  }, []);

  // ⭐ AUTO REFRESH every 30 seconds
  useEffect(() => {
    load(); // Initial load
    
    if (!autoRefresh) return;
    
    const interval = setInterval(() => {
      load();
    }, 30000); // 30 seconds
    
    return () => clearInterval(interval);
  }, [load, autoRefresh]);

  // ⭐ MANUAL REFRESH
  const handleRefresh = () => {
    setLoading(true);
    load();
  };

  if (loading && !stats) {
    return (
      <TopLayout title="Analytics">
        <div className="flex items-center justify-center h-96">
          <div className="animate-spin h-12 w-12 border-4 border-indigo-600 border-t-transparent rounded-full"></div>
        </div>
      </TopLayout>
    );
  }

  if (!stats) return null;

  // ⭐ CHART DATA - Dynamique men backend
  const statusData = {
    labels: stats.status_breakdown.map(s => s.status),
    datasets: [{
      data: stats.status_breakdown.map(s => s.count),
      backgroundColor: stats.status_breakdown.map(s => s.color),
      borderWidth: 0,
    }],
  };

  const weeklyData = {
    labels: stats.daily_stats.map(d => d.day),
    datasets: [{
      label: "Candidatures",
      data: stats.daily_stats.map(d => d.count),
      backgroundColor: "rgba(99, 102, 241, 0.8)",
      borderColor: "#6366f1",
      borderWidth: 2,
      borderRadius: 6,
      fill: true,
    }],
  };

  const lineOptions = {
    responsive: true,
    maintainAspectRatio: false,
    plugins: { legend: { display: false } },
    scales: {
      y: { beginAtZero: true, ticks: { stepSize: 1 } },
      x: { grid: { display: false } },
    },
  };

  return (
    <TopLayout title="Analytics Recruteur">
      <div className="space-y-6">
        
        {/* HEADER + CONTROLS */}
        <div className="flex items-center justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Tableau de Bord</h1>
            {lastUpdate && (
              <p className="text-slate-400 text-sm mt-1">
                Dernière mise à jour: {lastUpdate.toLocaleTimeString('fr-FR')}
              </p>
            )}
          </div>
          <div className="flex items-center gap-3">
            {/* AUTO REFRESH TOGGLE */}
            <button
              onClick={() => setAutoRefresh(!autoRefresh)}
              className={`flex items-center gap-2 px-3 py-2 rounded-xl text-sm ${
                autoRefresh ? 'bg-green-50 text-green-700' : 'bg-slate-100 text-slate-500'
              }`}
            >
              <Activity size={16} />
              {autoRefresh ? 'Auto ON' : 'Auto OFF'}
            </button>
            
            {/* MANUAL REFRESH */}
            <button
              onClick={handleRefresh}
              disabled={loading}
              className="flex items-center gap-2 px-4 py-2 bg-indigo-600 text-white rounded-xl hover:bg-indigo-500 disabled:opacity-50"
            >
              <RefreshCw size={16} className={loading ? 'animate-spin' : ''} />
              Actualiser
            </button>
          </div>
        </div>

        {/* STATS CARDS - Dynamique */}
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-4">
          
          {/* TOTAL */}
          <StatCard
            title="Total Candidatures"
            value={stats.total_applications}
            icon={<FileText size={24} className="text-indigo-600" />}
            trend={stats.month_growth}
            trendLabel="vs mois dernier"
            color="indigo"
          />

          {/* ACCEPTED */}
          <StatCard
            title="Acceptées"
            value={stats.accepted}
            icon={<CheckCircle size={24} className="text-green-600" />}
            subtitle={`${stats.total_applications > 0 ? Math.round((stats.accepted / stats.total_applications) * 100) : 0}% taux`}
            color="green"
          />

          {/* INTERVIEW */}
          <StatCard
            title="Entretiens"
            value={stats.interview}
            icon={<Clock size={24} className="text-blue-600" />}
            subtitle="En cours"
            color="blue"
          />

          {/* EMAIL RATE */}
          <StatCard
            title="Taux d'ouverture"
            value={`${stats.email_open_rate}%`}
            icon={<Eye size={24} className="text-purple-600" />}
            subtitle={`${stats.opened_emails} / ${stats.total_emails} emails`}
            color="purple"
          />
        </div>

        {/* CHARTS ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* LINE CHART - Weekly */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Calendar size={20} />
              Activité des 7 derniers jours
            </h3>
            <div className="h-[300px]">
              <Line data={weeklyData} options={lineOptions} />
            </div>
          </div>

          {/* DOUGHNUT - Status */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4">
              Répartition par Status
            </h3>
            <div className="h-[300px] flex items-center justify-center">
              <Doughnut 
                data={statusData} 
                options={{
                  responsive: true,
                  maintainAspectRatio: false,
                  plugins: {
                    legend: { position: 'bottom', labels: { padding: 20, usePointStyle: true } }
                  }
                }}
              />
            </div>
          </div>
        </div>

        {/* BOTTOM ROW */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          
          {/* TOP CANDIDATES */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Users size={20} />
              Top Candidats
            </h3>
            <div className="space-y-3">
              {stats.top_candidates.map((c, i) => (
                <div key={c.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <div className="h-10 w-10 rounded-full bg-indigo-100 flex items-center justify-center text-indigo-700 font-bold">
                    {i + 1}
                  </div>
                  <div className="flex-1">
                    <p className="font-medium text-slate-900">{c.name}</p>
                    <p className="text-sm text-slate-500">{c.email}</p>
                  </div>
                  <div className="text-right">
                    <p className="font-bold text-indigo-600">{c.applications}</p>
                    <p className="text-xs text-slate-400">candidatures</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* RECENT ACTIVITY - Dynamique */}
          <div className="bg-white rounded-2xl border border-slate-200 p-6 shadow-sm">
            <h3 className="text-lg font-semibold text-slate-900 mb-4 flex items-center gap-2">
              <Activity size={20} />
              Activité Récente
            </h3>
            <div className="space-y-3 max-h-[400px] overflow-y-auto">
              {stats.recent_activity.map((a) => (
                <div key={a.id} className="flex items-center gap-4 p-3 bg-slate-50 rounded-xl">
                  <StatusIcon status={a.status} />
                  <div className="flex-1">
                    <p className="font-medium text-slate-900 text-sm">
                      {a.candidate} — {a.job_title}
                    </p>
                    <p className="text-xs text-slate-500">{a.company}</p>
                  </div>
                  <span className="text-xs text-slate-400">{a.time_ago}</span>
                </div>
              ))}
            </div>
          </div>
        </div>

      </div>
    </TopLayout>
  );
}

// ⭐ COMPONENT: StatCard
function StatCard({ title, value, icon, trend, trendLabel, subtitle, color }) {
  const colors = {
    indigo: "bg-indigo-50",
    green: "bg-green-50",
    blue: "bg-blue-50",
    purple: "bg-purple-50",
  };

  return (
    <div className="bg-white rounded-2xl border border-slate-200 p-5 shadow-sm">
      <div className="flex items-center justify-between">
        <div>
          <p className="text-slate-500 text-sm">{title}</p>
          <p className="text-3xl font-bold text-slate-900 mt-1">{value}</p>
        </div>
        <div className={`h-12 w-12 rounded-xl ${colors[color]} flex items-center justify-center`}>
          {icon}
        </div>
      </div>
      
      {trend !== undefined && (
        <div className={`flex items-center gap-1 mt-3 text-sm ${
          trend >= 0 ? 'text-green-600' : 'text-red-600'
        }`}>
          {trend >= 0 ? <ArrowUpRight size={16} /> : <ArrowDownRight size={16} />}
          <span>{Math.abs(trend)}% {trendLabel}</span>
        </div>
      )}
      
      {subtitle && <p className="mt-3 text-sm text-slate-500">{subtitle}</p>}
    </div>
  );
}

// ⭐ COMPONENT: StatusIcon
function StatusIcon({ status }) {
  const icons = {
    "Acceptée": <CheckCircle size={20} className="text-green-600" />,
    "Refusée": <XCircle size={20} className="text-red-600" />,
    "Entretien": <Clock size={20} className="text-blue-600" />,
    "En attente": <Clock size={20} className="text-orange-600" />,
  };
  
  const bgColors = {
    "Acceptée": "bg-green-100",
    "Refusée": "bg-red-100",
    "Entretien": "bg-blue-100",
    "En attente": "bg-orange-100",
  };

  return (
    <div className={`h-10 w-10 rounded-full ${bgColors[status]} flex items-center justify-center`}>
      {icons[status]}
    </div>
  );
}