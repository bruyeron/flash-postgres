/**
 * src/components/Login.jsx
 * Formulaire de connexion — inputs toujours clairs (fond blanc, texte sombre).
 */
import { useState } from 'react';
import { useAuth } from '../context/AuthContext';

export default function Login() {
  const { login } = useAuth();
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError]       = useState('');
  const [loading, setLoading]   = useState(false);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError('');
    setLoading(true);
    try {
      await login(username.trim(), password);
    } catch (err) {
      setError(err.message || 'Identifiants incorrects');
    } finally {
      setLoading(false);
    }
  };

  // Classe commune pour tous les inputs : fond blanc, texte sombre, toujours
  const inputClass =
    'w-full border border-slate-300 bg-white text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2.5 text-sm outline-none focus:border-[#00afa9] focus:ring-2 focus:ring-[#00afa9]/20 transition-all';

  return (
    <div className="min-h-screen flex items-center justify-center bg-slate-100">
      <div className="max-w-sm w-full bg-white rounded-xl shadow-xl overflow-hidden">

        {/* Bandeau teal */}
        <div className="bg-[#00afa9] py-8 flex items-center justify-center">
          <img
            src="https://www.connecteo.mg/integration/images/design/logo-connecteo-with-text.svg"
            alt="Logo Connecteo"
            className="h-16 w-auto object-contain"
          />
        </div>

        {/* Corps */}
        <div className="p-8">
          <h2 className="text-xl font-bold text-slate-700 mb-1 text-center">Bienvenue</h2>
          <p className="text-center text-slate-400 text-sm mb-6">
            Connectez-vous pour accéder aux données Flash Production.
          </p>

          {error && (
            <div className="flex items-center gap-2 text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2 mb-4">
              <span>⚠</span> {error}
            </div>
          )}

          <form onSubmit={handleSubmit} className="flex flex-col gap-4">
            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Nom d'utilisateur
              </label>
              <input
                type="text"
                autoComplete="username"
                value={username}
                onChange={e => setUsername(e.target.value)}
                required
                className={inputClass}
                placeholder="ex: jean.dupont"
              />
            </div>

            <div>
              <label className="block text-xs font-semibold text-slate-500 mb-1.5 uppercase tracking-wide">
                Mot de passe
              </label>
              <input
                type="password"
                autoComplete="current-password"
                value={password}
                onChange={e => setPassword(e.target.value)}
                required
                className={inputClass}
                placeholder="••••••••"
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-[#00afa9] hover:bg-teal-600 active:scale-[.98] disabled:opacity-60 text-white px-4 py-2.5 rounded-lg font-semibold transition-all shadow-sm cursor-pointer mt-1"
            >
              {loading
                ? <span className="flex items-center justify-center gap-2"><span className="animate-spin inline-block w-4 h-4 border-2 border-white border-t-transparent rounded-full" />Connexion…</span>
                : 'Se connecter'
              }
            </button>
          </form>
        </div>
      </div>
    </div>
  );
}
