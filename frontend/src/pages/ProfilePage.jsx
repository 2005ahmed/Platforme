import { useState, useEffect } from "react";
import Layout from "../components/TopLayout";
import api from "../services/api";

import {
  Upload,
  FileText,
  Save,
  Trash2,
  Eye,
  Camera,
} from "lucide-react";

export default function ProfilePage() {
  const user = JSON.parse(localStorage.getItem("user"));
  const role = user?.role;

  const [form, setForm] = useState({
    full_name: "",
    email: "",
    phone: "",
    title: "",
    bio: "",
  });

  const [cv, setCv] = useState(null);
  const [cvName, setCvName] = useState("");
  const [msg, setMsg] = useState("");
  
  // Photo states
  const [photo, setPhoto] = useState(null);
  const [photoPreview, setPhotoPreview] = useState("");
  const [photoUrl, setPhotoUrl] = useState("");

  // LOAD PROFILE
  const load = async () => {
    try {
      const res = await api.get("/profile");

      setForm({
        full_name: res.data.full_name || "",
        email: res.data.email || "",
        phone: res.data.phone || "",
        title: res.data.title || "",
        bio: res.data.bio || "",
      });

      setCvName(res.data.cv_filename || "");
      
      // Load photo URL if exists
      if (res.data.photo_url) {
        setPhotoUrl(res.data.photo_url);
      }
    } catch (err) {
      console.log(err);
    }
  };

  useEffect(() => {
    load();
  }, []);

  // SAVE PROFILE
  const saveProfile = async () => {
    try {
      setMsg("");

      await api.put("/profile", form);

      setMsg("✅ Profil mis à jour");
    } catch (err) {
      console.log(err);
    }
  };

  // UPLOAD CV
  const uploadCV = async () => {
    if (!cv) return;

    try {
      setMsg("");

      const fd = new FormData();

      fd.append("file", cv);

      const res = await api.post("/profile/cv", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setCvName(res.data.filename);

      setMsg("✅ CV uploadé avec succès");

    } catch (err) {
      console.log(err);
    }
  };

  // HANDLE PHOTO SELECTION
  const handlePhotoChange = (e) => {
    const file = e.target.files?.[0];
    if (file) {
      setPhoto(file);
      // Create preview URL
      const previewUrl = URL.createObjectURL(file);
      setPhotoPreview(previewUrl);
    }
  };

  // UPLOAD PHOTO
  const uploadPhoto = async () => {
    if (!photo) return;


    

    try {
      setMsg("");

      const fd = new FormData();
      fd.append("photo", photo);

      const res = await api.post("/profile/photo", fd, {
        headers: {
          "Content-Type": "multipart/form-data",
        },
      });

      setPhotoUrl(res.data.photo_url);
      setPhotoPreview("");
      setPhoto(null);

      setMsg("✅ Photo de profil mise à jour");
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur lors de l'upload de la photo");
    }
  };

 // ✅ VOIR CV — Ouvrir dans nouvel onglet
  const viewCV = () => {
  if (!cvName) return;
  
  // Flask kayserve /uploads/... directement
  const cvUrl = `http://127.0.0.1:5000/uploads/${cvName}`;
  
  window.open(cvUrl, "_blank");
};

  // ✅ SUPPRIMER CV
  const deleteCV = async () => {
  if (!cvName) return;
  
  // Confirmation
  if (!window.confirm("Êtes-vous sûr de vouloir supprimer votre CV ?")) {
    return;
  }

  try {
    setMsg("");
    console.log("Deleting CV:", cvName);  // Debug

    const res = await api.delete("/profile/cv");

    console.log("Response:", res.data);   // Debug

    setCvName("");
    setCv(null);
    setMsg("✅ CV supprimé avec succès");

  } catch (err) {
    console.error("Error deleting CV:", err);
    console.error("Response:", err.response?.data);  // Voir l-erreur du backend
    setMsg(`❌ Erreur: ${err.response?.data?.message || "Suppression échouée"}`);
  }
};

  // REMOVE PHOTO
  const removePhoto = async () => {
    try {
      setMsg("");
      
      await api.delete("/profile/photo");
      
      setPhotoUrl("");
      setPhotoPreview("");
      setPhoto(null);
      
      setMsg("✅ Photo supprimée");
    } catch (err) {
      console.log(err);
      setMsg("❌ Erreur lors de la suppression");
    }
  };

  // ACCESS ONLY FOR USER / CANDIDATE
  if (role !== "user") {
    return (
      <Layout title="Profil">
        <div className="bg-white rounded-3xl p-10 text-center border border-slate-200 shadow-sm">

          <h2 className="text-2xl font-bold text-slate-900">
            Accès refusé
          </h2>

          <p className="text-slate-500 mt-3">
            Cette page est réservée aux candidats.
          </p>
        </div>
      </Layout>
    );
  }

  return (
    <Layout title="Profil">

      <div className="grid lg:grid-cols-[280px_1fr] gap-6">

        {/* LEFT CARD */}
        <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm h-fit">

          <div className="flex flex-col items-center text-center">

            {/* PHOTO DISPLAY */}
            <div className="relative">
              <div className="h-24 w-24 rounded-full overflow-hidden bg-indigo-600 flex items-center justify-center text-white text-3xl font-bold shadow-lg">
                {photoPreview ? (
                  <img 
                    src={photoPreview} 
                    alt="Preview" 
                    className="h-full w-full object-cover"
                  />
                ) : photoUrl ? (
                  <img 
                    src={photoUrl} 
                    alt="Profile" 
                    className="h-full w-full object-cover"
                  />
                ) : (
                  form.full_name
                    ? form.full_name.slice(0, 2).toUpperCase()
                    : "AS"
                )}
              </div>
              
              {/* Camera icon overlay for upload trigger */}
              <label 
                htmlFor="photo-upload"
                className="absolute -bottom-1 -right-1 h-8 w-8 rounded-full bg-indigo-600 hover:bg-indigo-500 flex items-center justify-center cursor-pointer shadow-md transition-colors"
              >
                <Camera size={14} className="text-white" />
              </label>
              
              <input
                id="photo-upload"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>

            <h2 className="mt-4 text-xl font-bold text-slate-900">
              {form.full_name || "your name"}
            </h2>

            <p className="text-slate-500 text-sm mt-1">
              {form.email || "ahmed@email.com"}
            </p>

            {/* Photo action buttons */}
            <div className="mt-4 w-full space-y-2">
              {photoPreview && (
                <button
                  onClick={uploadPhoto}
                  className="w-full py-2 rounded-xl bg-green-600 hover:bg-green-500 text-white font-semibold shadow-lg text-sm"
                >
                  Confirmer la photo
                </button>
              )}
              
              {photoUrl && !photoPreview && (
                <button
                  onClick={removePhoto}
                  className="w-full py-2 rounded-xl bg-red-50 hover:bg-red-100 text-red-700 font-semibold text-sm"
                >
                  Supprimer la photo
                </button>
              )}
              
              <label 
                htmlFor="photo-upload-btn"
                className="block w-full py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg cursor-pointer text-center"
              >
                {photoUrl ? "Changer la photo" : "Ajouter une photo"}
              </label>
              <input
                id="photo-upload-btn"
                type="file"
                accept="image/*"
                onChange={handlePhotoChange}
                className="hidden"
              />
            </div>
          </div>
        </div>

        {/* RIGHT SIDE */}
        <div className="space-y-6">

          {/* INFOS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">

            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Informations personnelles
            </h2>

            <div className="space-y-5">

              {/* FULL NAME */}
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Nom complet
                </label>

                <input
                  value={form.full_name}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      full_name: e.target.value,
                    })
                  }
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* EMAIL */}
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Email
                </label>

                <input
                  value={form.email}
                  disabled
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-100 text-slate-500"
                />
              </div>

              {/* PHONE */}
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Téléphone
                </label>

                <input
                  value={form.phone}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      phone: e.target.value,
                    })
                  }
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* TITLE */}
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Titre professionnel
                </label>

                <input
                  value={form.title}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      title: e.target.value,
                    })
                  }
                  placeholder="Développeur Full Stack"
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                />
              </div>

              {/* BIOGRAPHY */}
              <div>
                <label className="text-sm font-medium text-slate-600">
                  Biographie
                </label>

                <textarea
                  value={form.bio}
                  onChange={(e) =>
                    setForm({
                      ...form,
                      bio: e.target.value,
                    })
                  }
                  placeholder="Décrivez votre parcours professionnel..."
                  className="mt-2 w-full px-4 py-3 rounded-2xl border border-slate-200 bg-slate-50 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  rows={4}
                />
              </div>
            </div>
          </div>

          {/* DOCUMENTS */}
          <div className="bg-white border border-slate-200 rounded-3xl p-6 shadow-sm">

            <h2 className="text-2xl font-bold text-slate-900 mb-6">
              Documents
            </h2>

            {/* UPLOAD ZONE */}
            <div className="border-2 border-dashed border-slate-200 rounded-3xl bg-slate-50 p-10 text-center">

              <div className="flex justify-center mb-4">

                <div className="h-16 w-16 rounded-2xl bg-indigo-100 flex items-center justify-center">

                  <Upload
                    className="text-indigo-600"
                    size={30}
                  />
                </div>
              </div>

              <h3 className="font-semibold text-slate-800">
                Téléverser un CV
              </h3>

              <p className="text-slate-500 text-sm mt-2 mb-5">
                Glissez-déposez ou cliquez (PDF, DOCX)
              </p>

              <input
                type="file"
                accept=".pdf,.docx"
                onChange={(e) =>
                  setCv(e.target.files?.[0] || null)
                }
                className="mb-4"
              />

              <button
                onClick={uploadCV}
                className="px-6 py-3 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg"
              >
                Upload CV
              </button>
            </div>

            {/* FILE CARD */}
            {cvName && (
              <div className="mt-5 flex flex-col md:flex-row md:items-center md:justify-between gap-3 bg-slate-50 border border-slate-200 rounded-2xl p-4">

                <div className="flex items-center gap-3">

                  <FileText
                    className="text-indigo-600"
                    size={22}
                  />

                  <div>
                    <p className="font-medium text-slate-800">
                      {cvName}
                    </p>

                    <p className="text-xs text-green-600 font-medium">
                      ✔ Téléversé
                    </p>
                  </div>
                </div>

                {/* ✅ VOIR — Ouvrir CV dans nouvel onglet */}
      <button 
        onClick={() => viewCV()}
        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-green-50 text-green-700 hover:bg-green-100 text-sm"
      >
        <Eye size={16} />
        Voir
      </button>

      {/* ✅ SUPPRIMER — Supprimer CV */}
      <button 
        onClick={() => deleteCV()}
        className="flex items-center gap-1 px-4 py-2 rounded-xl bg-red-50 text-red-700 hover:bg-red-100 text-sm"
      >
        <Trash2 size={16} />
        Supprimer
      </button>
    </div>
            )}

            {/* SAVE BTN */}
            <button
              onClick={saveProfile}
              className="mt-6 w-full flex items-center justify-center gap-2 py-4 rounded-2xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold shadow-lg"
            >

              <Save size={18} />

              Enregistrer les modifications
            </button>

            {/* MESSAGE */}
            {msg && (
              <div className="mt-4 text-sm text-green-600 font-medium">
                {msg}
              </div>
            )}
          </div>
        </div>
      </div>
    </Layout>
  );
}