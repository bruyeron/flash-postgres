/**
 * src/components/AdminPanel.jsx
 * Interface admin — pointe vers les routes FastAPI /api/auth/users
 */
import { useState, useEffect, useCallback } from 'react';
import { useAuth } from '../context/AuthContext';
import { UserPlus, Pencil, Trash2, ShieldCheck, X, Save } from 'lucide-react';

const AVAILABLE_SERVICES = [
  'ARO', 'Autres', 'Free PRO', 'Mvola', 'Pam',
  'Prodigy', 'Stellarix', 'Telco OI', 'Welight', 'Yas', 'Yas Comores',
];

const INPUT_CLASS =
  'w-full border border-slate-300 bg-white text-slate-800 placeholder-slate-400 rounded-lg px-3 py-2 text-sm outline-none focus:border-[#00afa9] focus:ring-2 focus:ring-[#00afa9]/20 transition-all disabled:opacity-50 disabled:bg-slate-100';

const EMPTY_FORM = { username: '', password: '', role: 'user', services: [], active: true };

export default function AdminPanel({ dark, onClose }) {
  const { token } = useAuth();
  const [users, setUsers]     = useState([]);
  const [form, setForm]       = useState(EMPTY_FORM);
  const [editing, setEditing] = useState(null);
  const [error, setError]     = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);

  const bg   = dark ? 'bg-[#161b22] text-slate-200'   : 'bg-white text-slate-800';
  const card = dark ? 'bg-[#0d1117] border-[#30363d]' : 'bg-slate-50 border-slate-200';

  // ── Appels API vers FastAPI ───────────────────────────────────────────────
  const apiFetch = useCallback(async (path, method, body) => {
    const res = await fetch(`/api/auth${path}`, {
      method,
      headers: { 'Content-Type': 'application/json', Authorization: `Bearer ${token}` },
      body: body ? JSON.stringify(body) : undefined,
    });
    const data = await res.json();
    if (!res.ok) throw new Error(data.detail || 'Erreur serveur');
    return data;
  }, [token]);

  const loadUsers = useCallback(async () => {
    try {
      const data = await apiFetch('/users', 'GET');
      setUsers(data);
    } catch (e) { setError(e.message); }
  }, [apiFetch]);

  useEffect(() => { loadUsers(); }, [loadUsers]);

  const flash = (msg, isErr = false) => {
    if (isErr) setError(msg); else setSuccess(msg);
    setTimeout(() => { setError(''); setSuccess(''); }, 3000);
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    setLoading(true);
    try {
      if (editing) {
        const payload = { username: editing, role: form.role, services: form.services, active: form.active };
        if (form.password) payload.password = form.password;
        await apiFetch('/users', 'PUT', payload);
        flash('Compte mis à jour');
      } else {
        await apiFetch('/users', 'POST', form);
        flash('Compte créé');
      }
      setForm(EMPTY_FORM);
      setEditing(null);
      loadUsers();
    } catch (e) { flash(e.message, true); }
    finally { setLoading(false); }
  };

  const handleEdit = (u) => {
    setEditing(u.username);
    setForm({ username: u.username, password: '', role: u.role, services: u.services || [], active: u.active });
  };

  const handleDelete = async (username) => {
    if (!confirm(`Supprimer le compte "${username}" ?`)) return;
    try {
      await apiFetch('/users', 'DELETE', { username });
      flash('Compte supprimé');
      loadUsers();
    } catch (e) { flash(e.message, true); }
  };

  const toggleService = (svc) => {
    setForm(f => ({
      ...f,
      services: f.services.includes(svc) ? f.services.filter(s => s !== svc) : [...f.services, svc],
    }));
  };

  return (
    <div className="fixed inset-0 z-[200] bg-black/50 flex items-center justify-center p-4">
      <div className={`${bg} w-full max-w-2xl rounded-xl shadow-2xl flex flex-col max-h-[90vh]`}>

        {/* Header */}
        <div className="flex items-center justify-between px-6 py-4 border-b border-slate-200 flex-shrink-0">
          <div className="flex items-center gap-2">
            <ShieldCheck size={20} className="text-[#00afa9]" />
            <span className="font-bold text-lg">Gestion des comptes</span>
          </div>
          <button onClick={onClose} className="p-1 rounded hover:bg-slate-100 transition-colors">
            <X size={18} />
          </button>
        </div>

        <div className="overflow-y-auto flex-1 px-6 py-4 space-y-6">

          {error   && <p className="text-red-600 text-sm bg-red-50 border border-red-200 rounded-lg px-3 py-2">{error}</p>}
          {success && <p className="text-green-700 text-sm bg-green-50 border border-green-200 rounded-lg px-3 py-2">{success}</p>}

          {/* Formulaire */}
          <div className="border border-slate-200 rounded-xl p-4 bg-white">
            <h3 className="font-semibold text-sm text-slate-700 mb-4 flex items-center gap-2">
              <UserPlus size={16} className="text-[#00afa9]" />
              {editing ? `Modifier "${editing}"` : 'Nouveau compte'}
            </h3>

            <form onSubmit={handleSubmit} className="grid grid-cols-2 gap-3">
              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-slate-500 block mb-1">Nom d'utilisateur</label>
                <input type="text" required={!editing} disabled={!!editing}
                  value={form.username} onChange={e => setForm(f => ({ ...f, username: e.target.value }))}
                  className={INPUT_CLASS} placeholder="ex: jean.dupont" />
              </div>

              <div className="col-span-2 sm:col-span-1">
                <label className="text-xs font-medium text-slate-500 block mb-1">
                  Mot de passe{editing && <span className="text-slate-400 font-normal"> (vide = inchangé)</span>}
                </label>
                <input type="password" required={!editing}
                  value={form.password} onChange={e => setForm(f => ({ ...f, password: e.target.value }))}
                  className={INPUT_CLASS} placeholder="••••••••" />
              </div>

              <div>
                <label className="text-xs font-medium text-slate-500 block mb-1">Rôle</label>
                <select value={form.role} onChange={e => setForm(f => ({ ...f, role: e.target.value }))}
                  className={INPUT_CLASS}>
                  <option value="user">Utilisateur</option>
                  <option value="admin">Administrateur</option>
                </select>
              </div>

              <div className="flex items-end pb-2">
                <label className="flex items-center gap-2 cursor-pointer">
                  <input type="checkbox" checked={form.active}
                    onChange={e => setForm(f => ({ ...f, active: e.target.checked }))}
                    className="w-4 h-4 accent-[#00afa9]" />
                  <span className="text-sm text-slate-700">Compte actif</span>
                </label>
              </div>

              {form.role === 'user' && (
                <div className="col-span-2">
                  <label className="text-xs font-medium text-slate-500 block mb-2">Services autorisés</label>
                  <div className="flex flex-wrap gap-2">
                    {AVAILABLE_SERVICES.map(svc => (
                      <button key={svc} type="button" onClick={() => toggleService(svc)}
                        className={`px-3 py-1 rounded-full text-xs font-semibold border transition-all cursor-pointer ${
                          form.services.includes(svc)
                            ? 'bg-[#00afa9] text-white border-[#00afa9]'
                            : 'bg-white text-slate-500 border-slate-300 hover:border-[#00afa9] hover:text-[#00afa9]'
                        }`}>{svc}</button>
                    ))}
                  </div>
                  {form.services.length === 0 && (
                    <p className="text-xs text-amber-600 mt-1.5">⚠ Aucun service sélectionné → aucune donnée visible</p>
                  )}
                </div>
              )}

              <div className="col-span-2 flex gap-2 justify-end pt-1">
                {editing && (
                  <button type="button" onClick={() => { setEditing(null); setForm(EMPTY_FORM); }}
                    className="px-4 py-2 text-sm rounded-lg border border-slate-300 text-slate-600 hover:bg-slate-100 transition-colors cursor-pointer">
                    Annuler
                  </button>
                )}
                <button type="submit" disabled={loading}
                  className="flex items-center gap-1.5 px-4 py-2 text-sm bg-[#00afa9] hover:bg-teal-600 disabled:opacity-60 text-white rounded-lg font-semibold transition-colors cursor-pointer">
                  <Save size={14} />
                  {editing ? 'Mettre à jour' : 'Créer le compte'}
                </button>
              </div>
            </form>
          </div>

          {/* Liste des comptes */}
          <div>
            <h3 className="font-semibold text-sm text-slate-700 mb-3">Comptes existants ({users.length})</h3>
            <div className="space-y-2">
              {users.map(u => (
                <div key={u.username} className={`flex items-center gap-3 border rounded-xl px-4 py-3 ${card}`}>
                  <div className="flex-1 min-w-0">
                    <span className="font-medium text-sm">{u.username}</span>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className={`text-xs px-2 py-0.5 rounded-full font-semibold ${u.role === 'admin' ? 'bg-gray-100 text-[#00AFA9]' : 'bg-gray-100 text-[#00AFA9]'}`}>
                        {u.role === 'admin' ? 'Admin' : 'Utilisateur'}
                      </span>
                      {!u.active && <span className="text-xs px-2 py-0.5 rounded-full bg-red-100 text-red-600 font-medium">Désactivé</span>}
                      {u.role === 'user' && (u.services || []).map(s => (
                        <span key={s} className="text-xs px-2 py-0.5 rounded-full bg-teal-100 text-teal-700 font-medium">{s}</span>
                      ))}
                      {u.role === 'user' && (u.services || []).length === 0 && (
                        <span className="text-xs text-slate-400 italic">aucun service</span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-1">
                    <button onClick={() => handleEdit(u)} title="Modifier"
                      className="p-1.5 rounded-lg hover:bg-slate-200 transition-colors cursor-pointer text-slate-500">
                      <Pencil size={14} />
                    </button>
                    {u.username !== 'admin' && (
                      <button onClick={() => handleDelete(u.username)} title="Supprimer"
                        className="p-1.5 rounded-lg hover:bg-red-100 text-red-500 transition-colors cursor-pointer">
                        <Trash2 size={14} />
                      </button>
                    )}
                  </div>
                </div>
              ))}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
