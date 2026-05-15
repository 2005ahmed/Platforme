import { useState } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../context/AuthContext";

export default function AuthPage() {
  const nav = useNavigate();
  const { login, register } = useAuth();

  const [mode, setMode] = useState("login");
  const [fullName, setFullName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [err, setErr] = useState("");

  const submit = async (e) => {
    e.preventDefault();
    setErr("");
    try {
      if (mode === "login") await login(email, password);
      else await register(fullName, email, password);
      nav("/dashboard");
    } catch (ex) {
      setErr(ex?.response?.data?.message || "Error");
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
            Connectez-vous pour gérer vos candidatures
          </p>

          <form onSubmit={submit} className="space-y-4">
            {mode === "register" && (
              <div>
                <label className="text-sm text-slate-600">Nom complet</label>
                <input
                  className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                  placeholder="Ahmed..."
                  value={fullName}
                  onChange={(e) => setFullName(e.target.value)}
                />
              </div>
            )}

            <div>
              <label className="text-sm text-slate-600">Adresse Email</label>
              <input
                className="mt-1 w-full px-4 py-3 rounded-xl border border-slate-200 focus:outline-none focus:ring-2 focus:ring-indigo-400"
                placeholder="exemple@gmail.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
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
              />
            </div>

            {err && (
              <p className="text-sm text-red-600 bg-red-50 border border-red-100 px-3 py-2 rounded-lg">
                {err}
              </p>
            )}

            <button className="w-full py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white font-semibold">
              {mode === "login" ? "Se connecter" : "Créer un compte"}
            </button>

            <button
              type="button"
              className="w-full py-3 rounded-xl border border-slate-200 hover:bg-slate-50 text-slate-700 font-semibold"
              onClick={() => setMode(mode === "login" ? "register" : "login")}
            >
              {mode === "login" ? "Créer un compte" : "J'ai déjà un compte"}
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}