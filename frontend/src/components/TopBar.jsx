import { useRef, useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { Sun, Moon, Upload, Power, CircleUserRound, ShieldCheck, ClipboardCheck } from 'lucide-react';
import logo from '../assets/logo.png';
import AdminPanel from './AdminPanel';
import WeeklyCompletionModal from './WeeklyCompletionModal';

// [v12-1] currentActivity ajouté : indique l'activité sélectionnée dans la TopBar
export default function TopBar({
  dark, onToggleTheme,
  allGroups, selectedGroup, onGroupChange,
  statusMsg, onFileLoad,
  sortedWeeks,
  currentActivity = '',
}) {
  const fileRef = useRef();
  const { isAuthenticated, user, logout, isAdmin } = useAuth();
  const [showAdmin, setShowAdmin]           = useState(false);
  const [showCompletion, setShowCompletion] = useState(false);

  const bg2    = dark ? 'bg-[#161b22]'     : 'bg-white';
  const border = dark ? 'border-[#30363d]' : 'border-slate-200';
  const text   = dark ? 'text-slate-200'   : 'text-slate-800';
  const muted  = dark ? 'text-slate-500'   : 'text-slate-400';
  const btnBase = 'w-9 h-9 rounded-lg border cursor-pointer flex items-center justify-center transition-all';
  const btn     = dark
    ? `${btnBase} bg-[#21262d] border-[#096475] hover:bg-[#00afa9] text-slate-300`
    : `${btnBase} bg-slate-100 border-[#cce1e1] hover:border-[#096475] hover:bg-[#00afa9] hover:text-white text-slate-600`;

  return (
    <>
      <div className={`h-14 ${bg2} border-b-2 ${border} flex items-center px-5 gap-3.5 flex-shrink-0 z-[100] shadow-sm`}>

        {/* Logo + Titre */}
        <div className="w-[110px] h-[34px] rounded-[9px] mt-2 flex items-center justify-center overflow-hidden flex-shrink-0 select-none">
          <img src={logo} alt="Logo" className="w-full h-full object-cover" />
        </div>
        <span className={`font-bold text-[18px] tracking-tight ${text}`}>Flash Production</span>
        <div className={`w-px h-[22px] ${dark ? 'bg-slate-700' : 'bg-slate-200'}`} />

        {/* Sélecteur d'activité */}
        <span className={`text-[12px] font-medium ${muted}`}>Activité :</span>
        {allGroups.length > 1 ? (
          <select
            className={`${dark ? 'bg-[#21262d] border-[#30363d] text-slate-200' : 'bg-slate-100 border-slate-200 text-slate-800'} border rounded-lg px-3 py-1.5 text-[12px] font-medium cursor-pointer outline-none min-w-[150px] focus:border-[#00afa9] focus:ring-2 focus:ring-[#00afa9]/20 transition-all`}
            value={selectedGroup}
            onChange={(e) => onGroupChange(e.target.value)}
          >
            <option value="">— Tous —</option>
            {allGroups
            .filter(g => g !== 'ARO' && g!== 'Autres')
              .map((g) => <option key={g} value={g}>{g}</option>)}
          </select>
        ) : (
          <span className={`${muted} ml-2`}>{allGroups[0] || '–'}</span>
        )}
        <span className={`text-[11px] font-normal ${muted}`}>{statusMsg}</span>

        {/* Actions à droite */}
        <div className="ml-auto flex items-center gap-2">

          {/* Utilisateur connecté */}
          {isAuthenticated && (
            <div className={`text-[12px] ${muted} mr-2 flex items-center gap-1`}>
              <CircleUserRound size={18} />
              <span>{user.username}</span>
              {isAdmin && (
                <span className="text-[10px] bg-[#00afa9]/20 text-[#00afa9] px-1.5 py-0.5 rounded-full font-semibold">Admin</span>
              )}
            </div>
          )}

          {/* Bouton Admin */}
          {isAdmin && (
            <button onClick={() => setShowAdmin(true)} title="Gestion des comptes"
              className={`${btnBase} ${dark ? 'bg-[#21262d] border-[#30363d] hover:border-[#00afa9] hover:bg-[#00afa9]/20' : 'bg-slate-100 border-slate-200 hover:border-[#00afa9] hover:bg-[#00afa9]/20'}`}>
              <ShieldCheck size={16} strokeWidth={2.5} className="text-[#00afa9]" />
            </button>
          )}

          {/* Bouton Complétion hebdomadaire — visible pour TOUS */}
          <button
            onClick={() => setShowCompletion(true)}
            title="Complétion hebdomadaire — Absence réelle & Non logués"
            className={`${btnBase} ${dark ? 'bg-[#21262d] border-[#30363d] hover:border-amber-500 hover:bg-amber-900/30' : 'bg-slate-100 border-slate-200 hover:border-amber-400 hover:bg-amber-50'}`}
          >
            <ClipboardCheck size={16} strokeWidth={2.5} className="text-amber-500" />
          </button>

          {/* Theme toggle */}
          <button onClick={onToggleTheme} title={dark ? 'Mode clair' : 'Mode sombre'} className={btn}>
            {dark ? <Sun size={18} strokeWidth={2.5} /> : <Moon size={18} strokeWidth={2.5} />}
          </button>

          {/* Bouton Charger CSV — ADMIN UNIQUEMENT */}
          {isAdmin && (
            <>
              <button
                onClick={() => fileRef.current.click()}
                className="bg-[#00afa9] hover:bg-[#096475] text-white px-4 py-2 rounded-lg text-[12px] cursor-pointer font-semibold flex items-center gap-1.5 transition-colors shadow-sm active:scale-95"
              >
                <Upload size={14} strokeWidth={2.5} />
                Charger CSV
              </button>
              <input ref={fileRef} type="file" accept=".csv,.txt" className="hidden"
                onChange={(e) => { onFileLoad(e.target.files[0]); e.target.value = ''; }} />
            </>
          )}

          {/* Déconnexion */}
          {isAuthenticated && (
            <button onClick={logout} title="Déconnexion" className={btn}>
              <Power size={18} strokeWidth={2.5} />
            </button>
          )}
        </div>
      </div>

      {/* Modals */}
      {showAdmin && <AdminPanel dark={dark} onClose={() => setShowAdmin(false)} />}

      {/* Modal complétion hebdomadaire */}
      {showCompletion && (
        <WeeklyCompletionModal
          dark={dark}
          sortedWeeks={sortedWeeks || []}
          onClose={() => setShowCompletion(false)}
          currentActivity={currentActivity}  // [v12-1] activité courante
        />
      )}
    </>
  );
}
