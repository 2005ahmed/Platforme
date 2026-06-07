import { useState, useEffect } from "react";
import TopLayout from "../components/TopLayout";
import api from "../services/api";
import { 
  Plus, X, Search, Briefcase, MapPin, DollarSign, 
  ChevronRight, Building2, Clock, BookOpen, 
  FileText, ExternalLink, Video
} from "lucide-react";

export default function ApplicationsPage() {
  const [apps, setApps] = useState([]);
  const [offers, setOffers] = useState([]);
  const [showModal, setShowModal] = useState(false);
  const [selectedOffer, setSelectedOffer] = useState(null);
  const [offerResources, setOfferResources] = useState([]);

  const load = async () => {
    try {
      const [appsRes, offersRes] = await Promise.all([
        api.get("/applications"),
        api.get("/resources/offers").catch(() => ({ data: [] }))
      ]);
      setApps(appsRes.data || []);
      setOffers(offersRes.data || []);
    } catch (err) {
      console.error(err);
    }
  };

  useEffect(() => { load(); }, []);

  // ⭐ CHARGER RESOURCES LIÉES M3A OFFRE
  const selectOffer = async (offer) => {
    setSelectedOffer(offer);
    
    // Jib resources li motala9in (ila kaynin f backend)
    try {
    const res = await api.get(`/resources/by-offer/${offer.id}`);
    setOfferResources(res.data);
  } catch (e) {
    console.error("Error loading resources:", e);
    setOfferResources([]);
  }
  };

  const applyFromOffer = async () => {
    if (!selectedOffer) return;
    try {
      await api.post("/applications", {
        company: selectedOffer.company,
        job_title: selectedOffer.title,
        status: "En attente"
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

  const getResourceIcon = (type) => {
    switch (type) {
      case "video": return <Video size={14} className="text-rose-500" />;
      case "guide": return <BookOpen size={14} className="text-amber-500" />;
      default: return <FileText size={14} className="text-blue-500" />;
    }
  };

  return (
    <TopLayout title="Mes Candidatures">
      <div className="max-w-5xl mx-auto space-y-6">
        
        {/* Header */}
        <div className="flex items-center justify-between">
          <h1 className="text-xl font-bold text-slate-900">Mes Candidatures</h1>
          <button 
            onClick={() => setShowModal(true)}
            className="bg-indigo-600 text-white px-4 py-2.5 rounded-xl font-medium hover:bg-indigo-700 transition-colors flex items-center gap-2 shadow-sm"
          >
            <Plus size={18} /> Nouvelle Candidature
          </button>
        </div>

        {/* Liste candidatures */}
        <div className="space-y-3">
          {apps.map(a => (
            <div key={a.id} className="bg-white border border-slate-200 rounded-2xl p-4 flex items-center justify-between hover:shadow-md transition-all">
              <div>
                <h3 className="font-semibold text-slate-900">{a.job_title}</h3>
                <p className="text-sm text-slate-500">{a.company}</p>
              </div>
              <span className={`px-3 py-1 rounded-full text-xs font-medium ${
                a.status === "En attente" ? "bg-amber-50 text-amber-700" :
                a.status === "Entretien" ? "bg-blue-50 text-blue-700" :
                a.status === "Acceptée" ? "bg-emerald-50 text-emerald-700" :
                "bg-rose-50 text-rose-700"
              }`}>
                {a.status}
              </span>
            </div>
          ))}
          {apps.length === 0 && (
            <div className="text-center py-12 text-slate-400">
              <Briefcase size={48} className="mx-auto mb-3 text-slate-200" />
              Aucune candidature encore
            </div>
          )}
        </div>

        {/* ⭐⭐⭐ MODAL: OFFRES + RESOURCES ⭐⭐⭐ */}
        {showModal && (
          <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
            <div className="bg-white rounded-2xl shadow-2xl w-full max-w-2xl max-h-[90vh] overflow-y-auto">
              
              {/* Header */}
              <div className="flex items-center justify-between p-6 border-b border-slate-200">
                <h2 className="text-xl font-bold text-slate-900">
                  {selectedOffer ? "Détails de l'offre" : "Choisir une offre"}
                </h2>
                <button onClick={() => { setShowModal(false); setSelectedOffer(null); }} className="p-2 hover:bg-slate-100 rounded-lg transition-colors">
                  <X size={20} className="text-slate-500" />
                </button>
              </div>

              <div className="p-6">
                {!selectedOffer ? (
                  /* ===== LISTE DES OFFRES ===== */
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
                                <DollarSign size={10} /> {offer.salary_range}
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
                  /* ===== DÉTAILS OFFRE + RESOURCES LIÉES ===== */
                  <div className="space-y-6">
                    
                    {/* Info offre */}
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
                            <DollarSign size={10} /> {selectedOffer.salary_range}
                          </span>
                        )}
                      </div>
                    </div>

                    {/* ⭐⭐⭐ RESOURCES LIÉES ⭐⭐⭐ */}
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

                    {/* Boutons */}
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