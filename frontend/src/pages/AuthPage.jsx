import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const nav = useNavigate();
  const { login, register, user } = useAuth();

  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  // ⭐ Ila deja logged in, redirect automatiquement
  useEffect(() => {
    if (user) {
      redirectByRole(user);
    }
  }, [user]);

  // ⭐ Function dial redirect b7asab role
  const redirectByRole = (userData) => {
    if (userData.is_admin) {
      nav("/admin");
    } else if (userData.role === "recruiter") {
      nav("/recruiter");
    } else {
      nav("/dashboard");
    }
  };

  const submit = async (e) => {
    e.preventDefault();
    setErr("");

    try {
      let userData;

      if (mode === "login") {
        userData = await login(email, password);
      } else {
        userData = await register(fullName, email, password);
      }

      // ⭐ Redirect b7asab role li jay men backend
      if (userData) {
        redirectByRole(userData);
      } else {
        // Ila ma returnich user, 9ra men localStorage
        const savedUser = JSON.parse(localStorage.getItem("user"));
        if (savedUser) {
          redirectByRole(savedUser);
        }
      }

    } catch (ex) {
      setErr(ex?.response?.data?.message || "Erreur de connexion");
    }
  };

  return (
    <div className="min-h-screen bg-slate-100">
      {/* Center card */}
      <div className="flex items-center justify-center px-4 py-10">
        <div className="w-full max-w-md bg-white rounded-2xl shadow-xl border border-slate-200 p-8">
          {/* Logo */}
          <div className="flex justify-center mb-4">
            <div className="h-14 w-14 rounded-2xl bg-indigo-50 border border-indigo-100 flex items-center justify-center">
              <span className="text-indigo-600 font-bold text-xl">JT</span>
            </div>
          </div>

          <h1 className="text-center text-xl font-bold text-slate-900">
            Bienvenue sur JobTracker
          </h1>
          <p className="text-center text-slate-500 text-sm mt-1 mb-6">
            {mode === "login"
              ? "Connectez-vous pour gérer vos candidatures"
              : "Créez votre compte pour commencer"}
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm text-slate-600">Nom complet</label>
                <input
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ahmed Saad..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                  required
                />
              </div>
            )}

            <div>
              <label className="text-sm text-slate-600">Adresse Email</label>
              <input
                type="email"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="exemple@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                required
              />
            </div>

            <div>
              <label className="text-sm text-slate-600">Mot de passe</label>
              <input
                type="password"
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="********"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                minLength={6}
              />
            </div>

            {err && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {err}
              </p>
            )}

            <button
              type="submit"
              className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold transition"
            >
              {mode === "login" ? "Se connecter" : "Créer un compte"}
            </button>

            <button
              type="button"
              className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold transition"
              onClick={() => {
                setMode(mode === "login" ? "register" : "login");
                setErr("");
              }}
            >
              {mode === "login"
                ? "Créer un compte"
                : "J'ai déjà un compte"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}