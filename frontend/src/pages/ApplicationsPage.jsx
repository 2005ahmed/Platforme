import { useEffect, useState } from "react";
import Layout from "../components/TopLayout";
import api from "../services/api";

import {
  Building2,
  MapPin,
  CalendarDays,
  Clock3,
  Pencil,
  FileText,
  Trash2,
  Search,
  Plus,
} from "lucide-react";

export default function ApplicationsPage() {
  const [items, setItems] = useState([]);
  const [company, setCompany] = useState("");
  const [jobTitle, setJobTitle] = useState("");
  const [status, setStatus] = useState("En attente");
  const [filterStatus, setFilterStatus] = useState("Tous")
  const [search, setSearch] = useState("");
  const [openModal, setOpenModal] = useState(false);

  const load = async () => {
    try {
      const res = await api.get("/applications");
      setItems(res.data || []);
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  const add = async () => {
    if (!company || !jobTitle) return;

    try {
      await api.post("/applications", {
        company,
        job_title: jobTitle,
        status,
      });

      setCompany("");
      setJobTitle("");
      setStatus("En attente");

      load();
    } catch (err) {
      console.log(err);
    }
  };

  const del = async (id) => {
    try {
      await api.delete(`/applications/${id}`);
      load();
    } catch (err) {
      console.log(err);
    }
  };

  const filtered = items.filter((a) => {
  const matchSearch =
    a.company?.toLowerCase().includes(search.toLowerCase()) ||
    a.job_title?.toLowerCase().includes(search.toLowerCase());

  const matchStatus =
    filterStatus === "Tous" || a.status === filterStatus;

  return matchSearch && matchStatus;
});

  const statusStyle = (s) => {
    switch (s) {
      case "Acceptée":
        return "bg-green-100 text-green-700";

      case "Entretien":
        return "bg-blue-100 text-blue-700";

      case "Refusée":
        return "bg-red-100 text-red-700";

      default:
        return "bg-orange-100 text-orange-700";
    }
  };
  const user = JSON.parse(localStorage.getItem("user"));

  return (
    <Layout title="Candidatures">
      <div className="bg-white rounded-3xl border border-slate-200 p-6 shadow-sm">

        {/* HEADER */}
        <div className="flex flex-col md:flex-row md:items-center md:justify-between gap-4 mb-6">
          
          <div>
            <h1 className="text-2xl font-bold text-slate-900">
              Mes Candidatures
            </h1>

            <p className="text-slate-500 text-sm mt-1">
              Gérez toutes vos candidatures
            </p>
          </div>
          

          {user?.is_admin && (
            <button
            onClick={() => setOpenModal(true)}
            className="flex items-center gap-2 px-5 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white shadow-lg"
            >
              <Plus size={18} />
              Nouvelle Candidature
              </button>
            )}
        </div>

       <div className="flex flex-col md:flex-row gap-3 mb-6">
        <div className="relative flex-1">
          <Search
          size={18}
          className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400"
          />
          <input
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          placeholder="Rechercher entreprise ou poste..."
          className="w-full pl-10 px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50"
          />
          </div>
        {/* STATUS FILTER */}
        <select
        value={filterStatus}
        onChange={(e) => setFilterStatus(e.target.value)}
        className="px-4 py-3 rounded-2xl border border-slate-200 bg-white"
        >
          <option value="Tous">Tous</option>
          <option value="En attente">En attente</option>
          <option value="Entretien">Entretien</option>
          <option value="Acceptée">Acceptée</option>
          <option value="Refusée">Refusée</option>
          </select>
          </div>

        {/* MODAL */}
        {openModal && (
          <div className="fixed inset-0 bg-black/40 flex items-center justify-center z-50 p-4">

            <div className="bg-white w-full max-w-xl rounded-3xl p-6 shadow-2xl">

              <div className="flex items-center justify-between mb-6">
                <h2 className="text-xl font-bold text-slate-900">
                  Nouvelle Candidature
                </h2>

                <button
                  onClick={() => setOpenModal(false)}
                  className="text-slate-500 hover:text-black text-xl"
                >
                  ✕
                </button>
              </div>

              <div className="space-y-4">

                <input
                  value={company}
                  onChange={(e) => setCompany(e.target.value)}
                  placeholder="Entreprise"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                <input
                  value={jobTitle}
                  onChange={(e) => setJobTitle(e.target.value)}
                  placeholder="Poste"
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />

                <select
                  value={status}
                  onChange={(e) => setStatus(e.target.value)}
                  className="w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                >
                  <option>En attente</option>
                  <option>Entretien</option>
                  <option>Acceptée</option>
                  <option>Refusée</option>
                </select>

                <button
                  onClick={async () => {
                    await add();
                    setOpenModal(false);
                  }}
                  className="w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold"
                >
                  Ajouter la candidature
                </button>
              </div>
            </div>
          </div>
        )}

        {/* APPLICATIONS */}
        <div className="space-y-5">
          {filtered.map((a) => (
            <div
              key={a.id}
              className="border border-slate-200 rounded-3xl p-5 hover:shadow-md transition"
            >
              
              <div className="flex items-start justify-between gap-4">
                
                <div>
                  <h2 className="font-bold text-slate-900 text-lg">
                    {a.job_title}
                  </h2>

                  <div className="flex items-center gap-2 text-slate-500 text-sm mt-1">
                    <Building2 size={15} />
                    {a.company}
                  </div>

                  <div className="flex flex-wrap items-center gap-4 text-slate-400 text-xs mt-3">

                    <div className="flex items-center gap-1">
                      <MapPin size={14} />
                      Maroc
                    </div>

                    <div className="flex items-center gap-1">
                      <CalendarDays size={14} />
                      {a.created_at?.slice(0, 10)}
                    </div>

                    <div className="flex items-center gap-1">
                      <Clock3 size={14} />
                      Relance prévue
                    </div>
                  </div>
                </div>

                <div
                  className={`px-3 py-1 rounded-full text-xs font-semibold ${statusStyle(
                    a.status
                  )}`}
                >
                  {a.status}
                </div>
              </div>

              {/* ACTIONS */}
              <div className="flex flex-wrap gap-2 mt-5">

                <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-blue-50 text-blue-700 hover:bg-blue-100 text-sm">
                  <Pencil size={15} />
                  Modifier
                </button>

                <button className="flex items-center gap-1 px-3 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-sm">
                  <FileText size={15} />
                  Lettre
                </button>

                <button
                  onClick={() => del(a.id)}
                  className="flex items-center gap-1 px-3 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm"
                >
                  <Trash2 size={15} />
                  Supprimer
                </button>
              </div>

              {/* REMINDER */}
              {a.status === "En attente" && (
                <div className="mt-5 bg-orange-50 border border-orange-100 rounded-2xl p-4">
                  
                  <div className="text-sm font-semibold text-orange-700">
                    ⚠️ Rappel automatique activé
                  </div>

                  <div className="text-xs text-orange-500 mt-1">
                    Relancer l’employeur dans 2 jours
                  </div>
                </div>
              )}
            </div>
          ))}

          {!filtered.length && (
            <div className="text-center py-10 text-slate-500">
              Aucune candidature trouvée.
            </div>
          )}
        </div>
      </div>
    </Layout>
  );
}