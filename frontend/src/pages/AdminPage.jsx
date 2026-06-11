import { useEffect, useMemo, useState } from "react";
import Layout from "../components/TopLayout";
import api from "../services/api";

import {
  Chart as ChartJS, ArcElement, Tooltip, Legend,
} from "chart.js";
import { Doughnut } from "react-chartjs-2";

import {
  Users, Briefcase, PieChart, Trash2, Shield, User,
  Search, AlertTriangle, CheckCircle, XCircle, Loader2,
  Star, FileText, Plus, ChevronDown, BookOpen, Lightbulb,
  ExternalLink, Link as LinkIcon
} from "lucide-react";

ChartJS.register(ArcElement, Tooltip, Legend);

export default function AdminPage() {
  const [stats, setStats] = useState(null);
  const [users, setUsers] = useState([]);
  const [resources, setResources] = useState([]);
  const [offers, setOffers] = useState([]);
  const [advice, setAdvice] = useState([]);
  
  const [activeTab, setActiveTab] = useState("users");
  const [search, setSearch] = useState("");
  const [loading, setLoading] = useState(false);
  const [msg, setMsg] = useState("");
  const [deleteConfirm, setDeleteConfirm] = useState(null);

  // Resource form
  const [resourceForm, setResourceForm] = useState({
    title: "",
    type: "article",
    url: "",
    description: "",
    offer_id: null
  });
  const [resourceLoading, setResourceLoading] = useState(false);

  const load = async () => {
    try {
      setLoading(true);
      const [s, u, r, o, a] = await Promise.all([
        api.get("/admin/stats"),
        api.get("/admin/users"),
        api.get("/resources").catch(() => ({ data: [] })),
        api.get("/resources/offers").catch(() => ({ data: [] })),
        api.get("/resources/advice").catch(() => ({ data: [] })),
      ]);

      setStats(s.data);
      setUsers(u.data || []);
      setResources(r.data || []);
      setOffers(o.data || []);
      setAdvice(a.data || []);
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur de chargement");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  const deleteUser = async (userId) => {
    try {
      setMsg("");
      await api.delete(`/admin/users/${userId}`);
      setUsers(users.filter((u) => u.id !== userId));
      setDeleteConfirm(null);
      setMsg("✅ Utilisateur supprimé");
      const s = await api.get("/admin/stats");
      setStats(s.data);
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur lors de la suppression");
    }
  };

  const toggleAdmin = async (userId, currentStatus) => {
    try {
      setMsg("");
      await api.patch(`/admin/users/${userId}/role`, { is_admin: !currentStatus });
      setUsers(users.map((u) => u.id === userId ? { ...u, is_admin: !currentStatus } : u));
      setMsg(`✅ Rôle mis à jour`);
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur lors de la mise à jour");
    }
  };

  // ⭐ ADD RESOURCE
  const addResource = async (e) => {
    e.preventDefault();
    if (!resourceForm.title.trim()) return;
    
    setResourceLoading(true);
    try {
      const endpoint = activeTab === "offers" ? "/resources/offers" 
                     : activeTab === "advice" ? "/resources/advice" 
                     : "/resources";
      
      const payload = activeTab === "offers" ? {
          title: resourceForm.title,
          company: resourceForm.company,
          location: resourceForm.location,
          contract_type: resourceForm.contract_type,
          description: resourceForm.description,
          salary_range: resourceForm.salary_range
        } : activeTab === "advice" ? {
          title: resourceForm.title,
          content: resourceForm.description,
          category: resourceForm.category,
          tags: resourceForm.tags
        } : {
          title: resourceForm.title,
          type: resourceForm.type,
          url: resourceForm.url,
          description: resourceForm.description,
          offer_id: resourceForm.offer_id
        };

        console.log("Payload:", payload); 
      await api.post(endpoint, payload);
      setResourceForm({ title: "", type: "article", url: "", description: "", company: "", location: "", contract_type: "", salary_range: "", category: "", tags: "", offer_id: null });
      setMsg("✅ Publié avec succès");
      load();
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur lors de la publication");
    }
    setResourceLoading(false);
  };

  const deleteResource = async (id) => {
    try {
      const endpoint = activeTab === "offers" ? `/resources/offers/${id}` 
                     : activeTab === "advice" ? `/resources/advice/${id}` 
                     : `/resources/${id}`;
      await api.delete(endpoint);
      setMsg("✅ Supprimé");
      load();
    } catch (err) {
      setMsg("❌ Erreur suppression");
    }
  };

  const filteredUsers = users.filter(
    (u) => u.full_name?.toLowerCase().includes(search.toLowerCase()) ||
           u.email?.toLowerCase().includes(search.toLowerCase())
  );

  const chartData = useMemo(() => {
    if (!stats?.by_status) return null;
    return {
      labels: Object.keys(stats.by_status),
      datasets: [{
        data: Object.values(stats.by_status),
        backgroundColor: ["#6366f1", "#f59e0b", "#22c55e", "#ef4444"],
        borderWidth: 0, hoverOffset: 4,
      }],
    };
  }, [stats]);

  const chartOptions = {
    plugins: {
      legend: { position: "bottom", labels: { padding: 15, usePointStyle: true, pointStyle: "circle" } },
    },
    cutout: "65%",
  };

  const formatId = (id) => `#${String(id).padStart(3, '0')}`;
  const formatDate = (dateStr) => {
    if (!dateStr) return "-";
    const d = new Date(dateStr);
    return d.toLocaleDateString('fr-FR', { day: 'numeric', month: 'short', year: 'numeric' });
  };

  const tabs = [
    { id: "users", label: "Utilisateurs", icon: Users, count: users.length },
    { id: "resources", label: "Ressources", icon: BookOpen, count: resources.length },
    { id: "offers", label: "Offres", icon: Briefcase, count: offers.length },
    
  ];

  const updateForm = (field, value) => {
    setResourceForm(prev => ({ ...prev, [field]: value }));
  };

  return (
    <Layout title="Panneau d'Administration">
      {loading && !stats ? (
        <div className="flex items-center justify-center h-64">
          <Loader2 className="animate-spin text-indigo-600" size={40} />
        </div>
      ) : !stats ? (
        <p className="text-slate-500">Loading...</p>
      ) : (
        <div className="space-y-8">
          
          {/* MESSAGE */}
          {msg && (
            <div className={`mb-4 p-4 rounded-2xl font-medium flex items-center gap-2 ${
              msg.includes("✅") ? "bg-green-50 border border-green-200 text-green-700" : "bg-red-50 border border-red-200 text-red-700"
            }`}>
              {msg.includes("✅") ? <CheckCircle size={18} /> : <XCircle size={18} />}
              {msg}
            </div>
          )}

          {/* STATS CARDS */}
          <div className="grid md:grid-cols-4 gap-4">
            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-indigo-100 flex items-center justify-center">
                  <Users className="text-indigo-600" size={20} />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+15% ce mois</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total_users?.toLocaleString() || "0"}</p>
              <p className="text-xs text-slate-500 mt-1">Utilisateurs inscrits</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-amber-100 flex items-center justify-center">
                  <Briefcase className="text-amber-600" size={20} />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+8% ce mois</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total_applications?.toLocaleString() || "0"}</p>
              <p className="text-xs text-slate-500 mt-1">Candidatures totales</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-rose-100 flex items-center justify-center">
                  <FileText className="text-rose-600" size={20} />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+12% ce mois</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.total_offers || offers.length || "0"}</p>
              <p className="text-xs text-slate-500 mt-1">Offres publiées</p>
            </div>

            <div className="bg-white border border-slate-200 rounded-2xl p-5 shadow-sm">
              <div className="flex items-center justify-between mb-3">
                <div className="h-10 w-10 rounded-xl bg-yellow-100 flex items-center justify-center">
                  <Star className="text-yellow-600" size={20} />
                </div>
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-1 rounded-full">+5% ce mois</span>
              </div>
              <p className="text-2xl font-bold text-slate-900">{stats.satisfaction_rate || "94"}%</p>
              <p className="text-xs text-slate-500 mt-1">Satisfaction</p>
            </div>
          </div>

          {/* CHART */}
          <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
            <div className="flex items-center gap-3 mb-4">
              <PieChart className="text-purple-600" size={20} />
              <h3 className="font-bold text-slate-900">Répartition des candidatures</h3>
            </div>
            <div className="w-48 mx-auto">
              {chartData ? <Doughnut data={chartData} options={chartOptions} /> : <p className="text-slate-500 text-center">No data</p>}
            </div>
          </div>

          {/* TABS NAVIGATION */}
          <div className="bg-white border border-slate-200 rounded-2xl shadow-sm overflow-hidden">
            <div className="flex border-b border-slate-200">
              {tabs.map(t => (
                <button
                  key={t.id}
                  onClick={() => setActiveTab(t.id)}
                  className={`flex items-center gap-2 px-6 py-4 text-sm font-medium transition-all border-b-2 ${
                    activeTab === t.id
                      ? "border-indigo-600 text-indigo-600 bg-indigo-50/50"
                      : "border-transparent text-slate-500 hover:text-slate-700 hover:bg-slate-50"
                  }`}
                >
                  <t.icon size={16} />
                  {t.label}
                  <span className={`text-xs px-2 py-0.5 rounded-full ${
                    activeTab === t.id ? "bg-indigo-100 text-indigo-700" : "bg-slate-100 text-slate-500"
                  }`}>
                    {t.count}
                  </span>
                </button>
              ))}
            </div>

            <div className="p-6">
              {/* ===== TAB: UTILISATEURS ===== */}
              {activeTab === "users" && (
                <div>
                  <div className="flex items-center justify-between mb-4">
                    <div className="relative w-72">
                      <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
                      <input
                        value={search}
                        onChange={(e) => setSearch(e.target.value)}
                        placeholder="Rechercher..."
                        className="w-full pl-10 px-4 py-2.5 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
                      />
                    </div>
                  </div>

                  <div className="overflow-auto">
                    <table className="w-full">
                      <thead>
                        <tr className="border-b border-slate-200 text-slate-500 text-xs uppercase tracking-wider">
                          <th className="text-left py-3 px-4 font-medium">ID</th>
                          <th className="text-left py-3 px-4 font-medium">Nom</th>
                          <th className="text-left py-3 px-4 font-medium">Email</th>
                          <th className="text-left py-3 px-4 font-medium">Inscription</th>
                          <th className="text-left py-3 px-4 font-medium">Candidatures</th>
                          <th className="text-right py-3 px-4 font-medium">Actions</th>
                        </tr>
                      </thead>
                      <tbody>
                        {filteredUsers.map((u) => (
                          <tr key={u.id} className="border-b border-slate-100 hover:bg-slate-50 transition">
                            <td className="py-4 px-4 text-slate-500 font-mono text-sm">{formatId(u.id)}</td>
                            <td className="py-4 px-4 font-medium text-slate-900 text-sm">{u.full_name || "User"}</td>
                            <td className="py-4 px-4 text-slate-600 text-sm">{u.email}</td>
                            <td className="py-4 px-4 text-slate-500 text-sm">{formatDate(u.created_at)}</td>
                            <td className="py-4 px-4">
                              <span className="inline-flex items-center px-2.5 py-1 rounded-full text-xs font-medium bg-emerald-50 text-emerald-700">
                                {u.application_count || 0}
                              </span>
                            </td>
                            <td className="py-4 px-4 text-right">
                              <div className="flex items-center justify-end gap-2">
                                <button onClick={() => toggleAdmin(u.id, u.is_admin)} className="p-2 rounded-lg text-slate-400 hover:text-indigo-600 hover:bg-indigo-50 transition-colors">
                                  <Shield size={16} className={u.is_admin ? "text-indigo-600" : ""} />
                                </button>
                                <button onClick={() => setDeleteConfirm(u.id)} className="p-2 rounded-lg text-slate-400 hover:text-rose-600 hover:bg-rose-50 transition-colors">
                                  <Trash2 size={16} />
                                </button>
                              </div>
                              {deleteConfirm === u.id && (
                                <div className="absolute right-0 mt-2 bg-white border border-slate-200 rounded-xl shadow-lg p-3 z-10">
                                  <p className="text-xs text-slate-600 mb-2">Confirmer suppression ?</p>
                                  <div className="flex gap-2">
                                    <button onClick={() => deleteUser(u.id)} className="px-3 py-1.5 bg-rose-600 text-white rounded-lg text-xs">Oui</button>
                                    <button onClick={() => setDeleteConfirm(null)} className="px-3 py-1.5 bg-slate-100 text-slate-600 rounded-lg text-xs">Non</button>
                                  </div>
                                </div>
                              )}
                            </td>
                          </tr>
                        ))}
                        {!filteredUsers.length && (
                          <tr><td colSpan="6" className="py-10 text-center text-slate-400">Aucun utilisateur trouvé</td></tr>
                        )}
                      </tbody>
                    </table>
                  </div>
                </div>
              )}

              {/* ===== TAB: RESSOURCES ===== */}
      

{activeTab === "resources" && (
  <div className="space-y-6">
    
    {/* ===== FORMULAIRE "AJOUTER DES RESSOURCES" ===== */}
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Ajouter des ressources</h3>
      
      <form onSubmit={addResource} className="space-y-5">
        
        {/* Titre */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Titre de la ressource
          </label>
          <input
            type="text"
            placeholder="Ex: Guide pour réussir son entretien"
            value={resourceForm.title}
            onChange={e => updateForm("title", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm"
            required
          />
        </div>

        {/* Type */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Type
          </label>
          <div className="relative">
            <select
              value={resourceForm.type}
              onChange={e => updateForm("type", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm appearance-none"
            >
              <option value="article">Article</option>
              <option value="video">Vidéo</option>
              <option value="guide">Guide</option>
              <option value="tool">Outil</option>
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
        </div>

        {/* ⭐⭐⭐ DROPDOWN: LIÉ À UNE OFFRE ⭐⭐⭐ */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Lié à une offre (optionnel)
          </label>
          <div className="relative">
            <select
              value={resourceForm.offer_id || ""}
              onChange={e => updateForm("offer_id", e.target.value ? parseInt(e.target.value) : null)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm appearance-none"
            >
              <option value="">Aucune offre</option>
              {offers.map(offer => (
                <option key={offer.id} value={offer.id}>
                  {offer.company} — {offer.title}
                </option>
              ))}
            </select>
            <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
          </div>
          {/* Info: Ila offre sélectionnée */}
          {resourceForm.offer_id && (
            <p className="text-xs text-indigo-600 mt-1.5 flex items-center gap-1">
              <Briefcase size={12} />
              Cette ressource sera visible aux candidats qui consultent cette offre
            </p>
          )}
        </div>

        {/* Contenu / Lien */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Contenu / Lien
          </label>
          <textarea
            placeholder="Contenu ou URL de la ressource..."
            value={resourceForm.description}
            onChange={e => updateForm("description", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm resize-none min-h-[100px]"
            rows={4}
          />
        </div>

        {/* URL optionnel */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2 flex items-center gap-1">
            <LinkIcon size={14} /> URL (optionnel)
          </label>
          <input
            type="url"
            placeholder="https://..."
            value={resourceForm.url}
            onChange={e => updateForm("url", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm"
          />
        </div>

        {/* Button Gradient */}
        <button
          type="submit"
          disabled={resourceLoading}
          className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50"
        >
          {resourceLoading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Publier la ressource</>}
        </button>
      </form>
    </div>

    {/* ===== LISTE DES RESSOURCES PUBLIÉES ===== */}
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-900 mb-3">Ressources publiées ({resources.length})</h4>
      
      {resources.map(item => (
        <div key={item.id} className="flex items-start justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
          <div className="flex-1">
            <div className="flex items-center gap-2 mb-1 flex-wrap">
              {/* Badge Type */}
              <span className="text-xs font-medium text-indigo-600 bg-indigo-50 px-2 py-0.5 rounded-full capitalize">
                {item.type || "Article"}
              </span>
              
              {/* ⭐⭐⭐ BADGE: OFFRE LIÉE ⭐⭐⭐ */}
              {item.offer && (
                <span className="text-xs font-medium text-emerald-600 bg-emerald-50 px-2 py-0.5 rounded-full flex items-center gap-1">
                  <Briefcase size={10} />
                  {item.offer.company}
                </span>
              )}
            </div>
            
            <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
            <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.description}</p>
            
            {item.url && (
              <a href={item.url} target="_blank" rel="noopener noreferrer" className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-2">
                Voir <ExternalLink size={12} />
              </a>
            )}
          </div>
          
          <button onClick={() => deleteResource(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors ml-2 shrink-0">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      
      {resources.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">Aucune ressource publiée</div>
      )}
    </div>
  </div>
)}

              {activeTab === "offers" && (
  <div className="space-y-6">
    
    {/* ===== FORMULAIRE AJOUTER OFFRE ===== */}
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
      <h3 className="text-lg font-bold text-slate-900 mb-6">Ajouter une offre</h3>
      
      <form onSubmit={addResource} className="space-y-5">
        
        {/* Titre du poste */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Titre du poste *
          </label>
          <input
            type="text"
            placeholder="Ex: Développeur Full Stack"
            value={resourceForm.title}
            onChange={e => updateForm("title", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm placeholder:text-slate-400"
            required
          />
        </div>

        {/* Entreprise */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Entreprise *
          </label>
          <input
            type="text"
            placeholder="Ex: Google, Microsoft..."
            value={resourceForm.company || ""}
            onChange={e => updateForm("company", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm placeholder:text-slate-400"
            required
          />
        </div>

        {/* Lieu + Type */}
        <div className="grid grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Lieu
            </label>
            <input
              type="text"
              placeholder="Paris, Remote..."
              value={resourceForm.location || ""}
              onChange={e => updateForm("location", e.target.value)}
              className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm placeholder:text-slate-400"
            />
          </div>
          <div>
            <label className="block text-sm font-medium text-slate-700 mb-2">
              Type de contrat
            </label>
            <div className="relative">
              <select
                value={resourceForm.contract_type || "CDI"}
                onChange={e => updateForm("contract_type", e.target.value)}
                className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm appearance-none cursor-pointer"
              >
                <option value="CDI">CDI</option>
                <option value="CDD">CDD</option>
                <option value="Stage">Stage</option>
                <option value="Freelance">Freelance</option>
                <option value="Alternance">Alternance</option>
              </select>
              <ChevronDown size={16} className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 pointer-events-none" />
            </div>
          </div>
        </div>

        {/* Salaire */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Fourchette salariale
          </label>
          <input
            type="text"
            placeholder="Ex: 15 000 - 25 000 DH"
            value={resourceForm.salary_range || ""}
            onChange={e => updateForm("salary_range", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm placeholder:text-slate-400"
          />
        </div>

        {/* Description */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Description du poste
          </label>
          <textarea
            placeholder="Décrivez le poste, les missions, les prérequis..."
            value={resourceForm.description}
            onChange={e => updateForm("description", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm resize-none min-h-[100px] placeholder:text-slate-400"
            rows={4}
          />
        </div>

        {/* Prérequis */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Prérequis / Compétences
          </label>
          <textarea
            placeholder="Ex: Python, React, 3 ans d'expérience..."
            value={resourceForm.requirements || ""}
            onChange={e => updateForm("requirements", e.target.value)}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm resize-none placeholder:text-slate-400"
            rows={3}
          />
        </div>

        {/* Expiration */}
        <div>
          <label className="block text-sm font-medium text-slate-700 mb-2">
            Expire dans (jours)
          </label>
          <input
            type="number"
            min={1}
            max={90}
            value={resourceForm.expires_in_days || 30}
            onChange={e => updateForm("expires_in_days", parseInt(e.target.value))}
            className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm"
          />
        </div>

        {/* Button Gradient */}
        <button
          type="submit"
          disabled={resourceLoading}
          className="w-full bg-gradient-to-r from-emerald-500 to-teal-600 text-white py-3.5 rounded-xl font-medium hover:from-emerald-600 hover:to-teal-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-emerald-200 disabled:opacity-50"
        >
          {resourceLoading ? (
            <Loader2 size={18} className="animate-spin" />
          ) : (
            <>
              <Plus size={18} />
              Publier l'offre
            </>
          )}
        </button>
      </form>
    </div>

    {/* ===== LISTE DES OFFRES ===== */}
    <div className="space-y-3">
      <h4 className="font-semibold text-slate-900 mb-3">Offres publiées ({offers.length})</h4>
      
      {offers.map(item => (
        <div key={item.id} className="p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all border-l-4 border-l-emerald-400">
          <div className="flex items-center justify-between mb-2">
            <h4 className="font-semibold text-slate-900 text-sm">{item.title}</h4>
            <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
              {item.contract_type || "CDI"}
            </span>
          </div>
          <p className="text-xs text-slate-500">{item.company} • {item.location || "Remote"}</p>
          {item.salary_range && (
            <p className="text-xs text-emerald-600 mt-1 font-medium">{item.salary_range}</p>
          )}
          
          {/* ⭐⭐⭐ RESOURCES LIÉES ⭐⭐⭐ */}
          {item.resources && item.resources.length > 0 ? (
            <div className="mt-3 pt-3 border-t border-slate-100">
              <p className="text-xs font-medium text-slate-600 mb-2 flex items-center gap-1">
                <BookOpen size={12} /> Resources liées ({item.resources.length})
              </p>
              <div className="flex flex-wrap gap-2">
                {item.resources.map(r => (
                  <span key={r.id} className="text-xs bg-indigo-50 text-indigo-700 px-2 py-1 rounded-lg flex items-center gap-1">
                    {r.type === "video" ? <ExternalLink size={10} /> : <FileText size={10} />}
                    {r.title}
                  </span>
                ))}
              </div>
            </div>
          ) : (
            <p className="mt-3 pt-3 border-t border-slate-100 text-xs text-slate-400 italic">
              Aucune ressource liée. Ajoutez-en depuis l'onglet "Resources"
            </p>
          )}
          
          <button onClick={() => deleteResource(item.id)} className="mt-3 p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors">
            <Trash2 size={16} />
          </button>
        </div>
      ))}
      
      {offers.length === 0 && (
        <div className="text-center py-8 text-slate-400 text-sm">Aucune offre publiée</div>
      )}
    </div>
  </div>
)}
              {/* ===== TAB: CONSEILS ===== */}
              {/* {activeTab === "advice" && (
                <div className="space-y-6">
                
                  <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm">
                    <h3 className="text-lg font-bold text-slate-900 mb-6">Ajouter un conseil</h3>
                    
                    <form onSubmit={addResource} className="space-y-5">
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Titre</label>
                        <input type="text" placeholder="Ex: Comment négocier son salaire" value={resourceForm.title} onChange={e => updateForm("title", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm" required />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Catégorie</label>
                        <input type="text" placeholder="Ex: interview, negotiation..." value={resourceForm.category || ""} onChange={e => updateForm("category", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm" />
                      </div>
                      <div>
                        <label className="block text-sm font-medium text-slate-700 mb-2">Contenu</label>
                        <textarea placeholder="Contenu du conseil..." value={resourceForm.description} onChange={e => updateForm("description", e.target.value)} className="w-full px-4 py-3 rounded-xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400 focus:bg-white transition-all text-sm resize-none min-h-[120px]" required />
                      </div>
                      <button type="submit" disabled={resourceLoading} className="w-full bg-gradient-to-r from-indigo-500 to-purple-600 text-white py-3.5 rounded-xl font-medium hover:from-indigo-600 hover:to-purple-700 transition-all flex items-center justify-center gap-2 shadow-lg shadow-indigo-200 disabled:opacity-50">
                        {resourceLoading ? <Loader2 size={18} className="animate-spin" /> : <><Plus size={18} /> Publier le conseil</>}
                      </button>
                    </form>
                  </div>

                  
                  <div className="space-y-3">
                    <h4 className="font-semibold text-slate-900 mb-3">Conseils publiés ({advice.length})</h4>
                    {advice.map(item => (
                      <div key={item.id} className="flex items-start justify-between p-4 border border-slate-200 rounded-xl hover:bg-slate-50 transition-all">
                        <div>
                          {item.category && <span className="text-xs font-medium text-amber-600 bg-amber-50 px-2 py-0.5 rounded-full">{item.category}</span>}
                          <h4 className="font-semibold text-slate-900 text-sm mt-1">{item.title}</h4>
                          <p className="text-xs text-slate-500 mt-1 line-clamp-2">{item.content?.substring(0, 100)}...</p>
                        </div>
                        <button onClick={() => deleteResource(item.id)} className="p-2 text-slate-400 hover:text-rose-500 hover:bg-rose-50 rounded-lg transition-colors"><Trash2 size={16} /></button>
                      </div>
                    ))}
                    {advice.length === 0 && <div className="text-center py-8 text-slate-400 text-sm">Aucun conseil publié</div>}
                  </div>
                </div>
              )} */}

            </div>
          </div>

        </div>
      )}
    </Layout>
  );
}