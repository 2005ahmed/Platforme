import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import TopLayout from "../components/TopLayout";
import api from "../services/api";
import { 
  Plus, Search, Briefcase, MapPin, Calendar, Mail, 
  Building2, Clock, Bell, Loader2, Send, Eye , X, ChevronRight, BookOpen, ExternalLink , FileText, Video , Trash2
} from "lucide-react";

export default function ApplicationsPage() {
  const navigate = useNavigate();
  const [apps, setApps] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerResources, setOfferResources] = useState([]);
  const [searchQuery, setSearchQuery] = useState("");
  const [dateFilter, setDateFilter] = useState("all");
  const [loading, setLoading] = useState(false);
  const [user, setUser] = useState(null);

  // Get user from localStorage
  useEffect(() => {
    const saved = localStorage.getItem("user");
    if (saved) setUser(JSON.parse(saved));
  }, []);

  const isAdmin = user?.is_admin || user?.role === "recruiter";

  const load = async () => {
    try {
      setLoading(true);
      const [appsRes, offersRes] = await Promise.all([
        api.get("/applications"),
        api.get("/resources/offers").catch(() => ({ data: [] }))
      ]);
      setApps(appsRes.data || []);
      setOffers(offersRes.data || []);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => { load(); }, []);

  // ===== APPLY FROM OFFER =====
  const selectOffer = async (offer) => {
    setSelectedOffer(offer);
    try {
      const res = await api.get(`/resources/by-offer/${offer.id}`);
      setOfferResources(res.data);
    } catch (e) {
      console.error("Error loading resources:", e);
      setOfferResources([]);
    }
  };
  const openLetterModal = (app) => {
    navigate("/ai", { 
      state: {  
        company: app.company,
        job_title: app.job_title 
      } 
    });
  };

  const openCVModal = (app) => {
    if (app.cv_url) {
      window.open(app.cv_url, "_blank");  
    }
  }; 

  const deleteApplication = async (id) => {
    if (!window.confirm("Êtes-vous sûr de vouloir supprimer cette candidature ?")) return; 
    try {
      await api.delete(`/applications/${id}`);
      load();
      alert("Candidature supprimée");
    } catch (err) {
      console.error(err);
      alert("Erreur lors de la suppression");
    }
  }; 

  const applyFromOffer = async () => {
    if (!selectedOffer) return;
    try {
      await api.post("/applications", {
        company: selectedOffer.company,
        job_title: selectedOffer.title,
        location: selectedOffer.location,
        offer_id: selectedOffer.id
      });
      setShowModal(false);
      setSelectedOffer(null);
      load();
      alert("✅ Candidature envoyée!");
    } catch (err) {
      console.error(err);
      alert("❌ Erreur");
    }
  };

  // ===== GENERATE LETTER =====
  const generateLetter = (app) => {
    navigate("/ai", { 
      state: { 
        company: app.company,
        job_title: app.job_title 
      } 
    });
  };

  const getStatusConfig = (status) => {
    switch (status) {
      case "Acceptée":
        return {
          badge: "bg-emerald-50 text-emerald-700 border-emerald-200",
          border: "border-l-emerald-500",
        };
      case "Entretien":
        return {
          badge: "bg-blue-50 text-blue-700 border-blue-200",
          border: "border-l-blue-500",
        };
      case "Refusée":
        return {
          badge: "bg-rose-50 text-rose-700 border-rose-200",
          border: "border-l-rose-500",
        };
      case "En attente":
      default:
        return {
          badge: "bg-amber-50 text-amber-700 border-amber-200",
          border: "border-l-amber-500",
        };
    }
  };


  const getResourceIcon = (type) => {
    switch (type) {
      case "video": return <Video size={14} className="text-rose-500" />;
      case "guide": return <BookOpen size={14} className="text-amber-500" />;
      default: return <FileText size={14} className="text-blue-500" />;
    }
  };

  const filteredApps = apps.filter(app => {
    const matchesSearch = 
      app.job_title?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.company?.toLowerCase().includes(searchQuery.toLowerCase()) ||
      app.location?.toLowerCase().includes(searchQuery.toLowerCase());
    return matchesSearch;
  });

  return (
    <TopLayout title="Mes Candidatures">
      <div className="max-w-5xl mx-auto space-y-6">

        {/* ===== HEADER ===== */}
        <div className="flex items-center justify-between">
          <h1 className="text-2xl font-bold text-slate-900">Mes Candidatures</h1>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 hover:bg-indigo-700 text-white px-5 py-2.5 rounded-xl font-medium transition-colors flex items-center gap-2 shadow-lg shadow-indigo-200"
          >
            <Plus size={18} /> 
            Nouvelle Candidature
          </button>
        </div>

        {/* ===== SEARCH BAR ===== */}
        <div className="flex gap-3">
          <div className="relative flex-1">
            <Search size={18} className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
            <input
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Rechercher une candidature..."
              className="w-full pl-10 pr-4 py-3 rounded-xl border border-slate-200 bg-white focus:outline-none focus:ring-2 focus:ring-indigo-400 text-sm"
            />
          </div>
          <select
            value={dateFilter}
            onChange={(e) => setDateFilter(e.target.value)}
            className="px-4 py-3 rounded-xl border border-slate-200 bg-white text-sm focus:outline-none focus:ring-2 focus:ring-indigo-400"
          >
            <option value="all">Toutes les dates</option>
            <option value="week">Cette semaine</option>
            <option value="month">Ce mois</option>
            <option value="year">Cette année</option>
          </select>
        </div>

        {/* ===== APPLICATIONS LIST ===== */}
        {loading ? (
          <div className="text-center py-16">
            <Loader2 size={40} className="animate-spin mx-auto text-indigo-600 mb-4" />
            <p className="text-slate-500">Chargement...</p>
          </div>
        ) : (
          <div className="space-y-4">
            {filteredApps.map((app) => {
              const statusConfig = getStatusConfig(app.status);
              const hasReminder = app.status === "En attente";

              return (
                <div 
                  key={app.id} 
                  className={`bg-white rounded-2xl border border-slate-200 ${statusConfig.border} border-l-4 shadow-sm hover:shadow-md transition-all overflow-hidden`}
                >
                  {/* Main Card Content */}
                  <div className="p-5">
                    {/* Top Row: Title + Status */}
                    <div className="flex items-start justify-between mb-3">
                      <div>
                        <h3 className="font-bold text-slate-900 text-lg">{app.job_title}</h3>
                        <div className="flex items-center gap-2 mt-1">
                          <Building2 size={14} className="text-slate-400" />
                          <span className="text-sm text-slate-600">{app.company}</span>
                        </div>
                      </div>
                      <span className={`px-3 py-1.5 rounded-full text-xs font-semibold border ${statusConfig.badge}`}>
                        {app.status === "En attente" ? "En attente" : app.status}
                      </span>
                    </div>

                    {/* Info Row: Location, Date, Email */}
                    <div className="flex flex-wrap items-center gap-4 text-sm text-slate-500 mb-4">
                      {app.location && (
                        <div className="flex items-center gap-1.5">
                          <MapPin size={14} className="text-slate-400" />
                          <span>{app.location}</span>
                        </div>
                      )}
                      <div className="flex items-center gap-1.5">
                        <Calendar size={14} className="text-slate-400" />
                        <span>{app.applied_date || app.created_at?.slice(0, 10) || "Date non spécifiée"}</span>
                      </div>
                      {app.company_email && (
                        <div className="flex items-center gap-1.5">
                          <Mail size={14} className="text-slate-400" />
                          <a href={`mailto:${app.company_email}`} className="text-indigo-600 hover:underline">
                            {app.company_email}
                          </a>
                        </div>
                      )}
                    </div>

                    {/* ⭐ USER ACTIONS: Only Letter + View */}
                    <div className="flex flex-wrap items-center gap-2">
                    <div className="flex flex-wrap items-center gap-2">
                      <button 
                        onClick={() => openCVModal(app)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-indigo-50 text-indigo-700 hover:bg-indigo-100 text-xs font-medium transition-colors"
                      >
                        <Eye size={12} />
                        Voir CV
                      </button>
                      <button 
                        onClick={() => openLetterModal(app)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-emerald-50 text-emerald-700 hover:bg-emerald-100 text-xs font-medium transition-colors"
                      >
                        <Send size={12} />
                        Lettre
                      </button>
                      <button 
                        onClick={() => deleteApplication(app.id)}
                        className="flex items-center gap-1.5 px-3 py-1.5 rounded-lg bg-rose-50 text-rose-700 hover:bg-rose-100 text-xs font-medium transition-colors"
                      >
                        <Trash2 size={12} />
                        Supprimer
                      </button>
                    </div>

                      {/* ⭐ Admin/Recruiter badge - shows who manages this */}
                      {isAdmin && (
                        <span className="text-xs text-slate-400 ml-auto">
                          Admin gère le statut
                        </span>
                      )}
                    </div>
                  </div>

                  {/* RAPPEL AUTOMATIQUE (si en attente) */}
                  {hasReminder && (
                    <div className="bg-amber-50/80 border-t border-amber-100 px-5 py-3">
                      <div className="flex items-start gap-3">
                        <div className="p-1.5 bg-amber-100 rounded-lg">
                          <Bell size={14} className="text-amber-600" />
                        </div>
                        <div>
                          <p className="text-sm font-semibold text-amber-800">
                            Rappel automatique activé
                          </p>
                          <p className="text-xs text-amber-600 mt-0.5">
                            Relancer l'employeur dans 2 jours
                          </p>
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              );
            })}

            {filteredApps.length === 0 && (
              <div className="text-center py-16 bg-white rounded-2xl border border-slate-200">
                <Briefcase size={64} className="mx-auto mb-4 text-slate-200" />
                <p className="text-slate-500 text-lg font-medium">Aucune candidature trouvée</p>
                <p className="text-sm text-slate-400 mt-1">Commencez par postuler à une offre</p>
                <button 
                  onClick={() => setShowModal(true)}
                  className="mt-4 px-6 py-2.5 bg-indigo-600 text-white rounded-xl text-sm font-medium hover:bg-indigo-700 transition-colors"
                >
                  Nouvelle Candidature
                </button>
              </div>
            )}
          </div>
        )}

        {/* ===== MODAL: OFFRES + RESOURCES ===== */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedOffer ? "Détails de l'offre" : "Choisir une offre"}
                </h2>
                <button 
                  onClick={() => { setShowModal(false); setSelectedOffer(null); }} 
                  className="p-2 hover:bg-slate-100 rounded-lg transition-colors"
                >
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="p-6">
                {!selectedOffer ? (
                  <div className="space-y-3">
                    {offers.map(offer => (
                      <div 
                        key={offer.id}
                        onClick={() => selectOffer(offer)}
                        className="p-4 border-2 border-emerald-200 bg-emerald-50/50 rounded-xl hover:bg-emerald-50 hover:border-emerald-400 transition-all cursor-pointer group"
                      >
                        <div className="flex items-center justify-between">
                          <div>
                            <h4 className="font-semibold text-slate-900">{offer.title}</h4>
                            <div className="flex items-center gap-2 mt-1 text-xs text-slate-500">
                              <Building2 size={12} />
                              {offer.company}
                            </div>
                            <div className="flex items-center gap-3 mt-2">
                              <span className="flex items-center gap-1 text-xs text-slate-500">
                                <MapPin size={10} /> {offer.location || "Remote"}
                              </span>
                              <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-0.5 rounded-full font-medium">
                                {offer.contract_type || "CDI"}
                              </span>
                            </div>
                            {offer.salary_range && (
                              <p className="text-xs text-emerald-600 mt-1 font-medium flex items-center gap-1">
                                💰 {offer.salary_range}
                              </p>
                            )}
                          </div>
                          <ChevronRight size={20} className="text-emerald-400 group-hover:text-emerald-600" />
                        </div>
                      </div>
                    ))}
                    {offers.length === 0 && (
                      <div className="text-center py-8 text-slate-400">
                        <Briefcase size={32} className="mx-auto mb-2 text-slate-200" />
                        <p>Aucune offre disponible</p>
                      </div>
                    )}
                  </div>
                ) : (
                  <div className="space-y-6">
                    <div className="bg-emerald-50 border border-emerald-200 rounded-xl p-5">
                      <h3 className="font-bold text-slate-900 text-lg">{selectedOffer.title}</h3>
                      <div className="flex items-center gap-2 mt-1 text-sm text-slate-600">
                        <Building2 size={14} />
                        {selectedOffer.company}
                      </div>
                      <div className="flex items-center gap-3 mt-3 flex-wrap">
                        <span className="flex items-center gap-1 text-xs bg-white px-2 py-1 rounded-full text-slate-600">
                          <MapPin size={10} /> {selectedOffer.location || "Remote"}
                        </span>
                        <span className="text-xs bg-emerald-100 text-emerald-700 px-2 py-1 rounded-full font-medium">
                          {selectedOffer.contract_type || "CDI"}
                        </span>
                        {selectedOffer.salary_range && (
                          <span className="text-xs bg-white text-emerald-700 px-2 py-1 rounded-full font-medium flex items-center gap-1">
                            💰 {selectedOffer.salary_range}
                          </span>
                        )}
                      </div>
                    </div>

                    <div>
                      <h4 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                        <BookOpen size={18} className="text-indigo-600" />
                        Resources pour vous aider
                      </h4>
                      <div className="space-y-3">
                        {offerResources.length > 0 ? (
                          offerResources.map(resource => (
                            <div key={resource.id} className="p-4 border border-slate-200 rounded-xl hover:bg-indigo-50 transition-all cursor-pointer group">
                              <div className="flex items-start gap-3">
                                <div className="p-2 bg-white rounded-lg shadow-sm group-hover:shadow-md transition-shadow">
                                  {getResourceIcon(resource.type)}
                                </div>
                                <div className="flex-1">
                                  <div className="flex items-center gap-2">
                                    <h5 className="font-medium text-slate-900 text-sm">{resource.title}</h5>
                                    <span className="text-xs bg-indigo-50 text-indigo-600 px-2 py-0.5 rounded-full capitalize">
                                      {resource.type || "Article"}
                                    </span>
                                  </div>
                                  <p className="text-xs text-slate-500 mt-1 line-clamp-2">
                                    {resource.description}
                                  </p>
                                  {resource.url && (
                                    <a 
                                      href={resource.url} 
                                      target="_blank" 
                                      rel="noopener noreferrer"
                                      className="inline-flex items-center gap-1 text-xs text-indigo-600 hover:text-indigo-700 mt-2 font-medium"
                                      onClick={e => e.stopPropagation()}
                                    >
                                      Voir <ExternalLink size={12} />
                                    </a>
                                  )}
                                </div>
                              </div>
                            </div>
                          ))
                        ) : (
                          <div className="text-center py-6 bg-slate-50 rounded-xl border border-slate-200">
                            <BookOpen size={24} className="mx-auto mb-2 text-slate-300" />
                            <p className="text-sm text-slate-400">Aucune ressource liée à cette offre</p>
                          </div>
                        )}
                      </div>
                    </div>

                    <div className="flex gap-3">
                      <button
                        onClick={() => setSelectedOffer(null)}
                        className="flex-1 px-4 py-3 rounded-xl border border-slate-200 text-slate-600 font-medium hover:bg-slate-50 transition-colors"
                      >
                        Retour
                      </button>
                      <button
                        onClick={applyFromOffer}
                        className="flex-1 bg-emerald-600 text-white py-3 rounded-xl font-medium hover:bg-emerald-700 transition-colors flex items-center justify-center gap-2 shadow-lg shadow-emerald-200"
                      >
                        <Plus size={18} />
                        Postuler à {selectedOffer.company}
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
          </div>
        )}

      </div>
    </TopLayout>
  );
}