/**
 * src/components/CellCommentPopover.jsx
 *
 * MODIFICATIONS PAR RAPPORT À L'ORIGINAL :
 *
 *  [fix-1] Input contrôlé (value + onChange) au lieu de ref non contrôlé
 *          → React détecte le changement d'état et re-render la liste
 *          → le commentaire s'affiche immédiatement après soumission
 *  [fix-2] État `inputValue` local — vidé proprement après envoi
 *  [fix-3] Indicateur visuel "_pending" sur les commentaires en cours d'envoi
 *          (petit spinner ou texte grisé pendant l'appel API)
 *  [fix-4] Bouton Envoyer désactivé si champ vide ou commentaire en cours
 *  [fix-5] Scroll automatique vers le dernier commentaire après ajout
 *  [fix-6] deleteComment exposé et utilisable pour l'auteur ou l'admin
 */

import { useEffect, useRef, useState, useCallback } from 'react';
import { useComments } from '../context/CommentContext';
import { useAuth }     from '../context/AuthContext';
import { X, Send, MessageSquare, Loader2, Trash2 } from 'lucide-react';

function fmtDate(iso) {
  const d   = new Date(iso);
  const pad = n => String(n).padStart(2, '0');
  return `${pad(d.getDate())}/${pad(d.getMonth()+1)}/${d.getFullYear()} ${pad(d.getHours())}:${pad(d.getMinutes())}`;
}

export default function CellCommentPopover({ cellKey, dark, onClose, anchorRect }) {
  const { getComments, addComment, deleteComment } = useComments();
  const { user } = useAuth();
  const author   = user?.username || 'anonyme';
  const isAdmin  = user?.role === 'admin';

  // [fix-1] Input contrôlé
  const [inputValue, setInputValue] = useState('');
  // [fix-4] flag d'envoi en cours
  const [sending, setSending] = useState(false);

  const popRef      = useRef(null);
  const listRef     = useRef(null);

  const comments = getComments(cellKey);

  // Focus auto à l'ouverture
  const inputRef = useRef(null);
  useEffect(() => { inputRef.current?.focus(); }, []);

  // [fix-5] Scroll vers le bas quand un nouveau commentaire arrive
  useEffect(() => {
    if (listRef.current) {
      listRef.current.scrollTop = listRef.current.scrollHeight;
    }
  }, [comments.length]);

  // Ferme si clic en dehors
  useEffect(() => {
    let mounted = false;
    const handler = (e) => {
      if (!mounted) return;
      if (popRef.current && !popRef.current.contains(e.target)) onClose();
    };
    const t = requestAnimationFrame(() => { mounted = true; });
    document.addEventListener('mousedown', handler);
    return () => {
      cancelAnimationFrame(t);
      document.removeEventListener('mousedown', handler);
    };
  }, [onClose]);

  // [fix-1] handleSend avec state contrôlé
  const handleSend = useCallback(async () => {
    const val = inputValue.trim();
    if (!val || sending) return;

    setSending(true);
    setInputValue(''); // [fix-2] vider immédiatement — le commentaire apparaît via optimistic update

    await addComment(cellKey, author, val);

    setSending(false);
    inputRef.current?.focus();
  }, [inputValue, sending, addComment, cellKey, author]);

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) { e.preventDefault(); handleSend(); }
    if (e.key === 'Escape') onClose();
  };

  const handleDelete = useCallback(async (commentId) => {
    await deleteComment(commentId, cellKey);
  }, [deleteComment, cellKey]);

  // Positionnement
  const top  = anchorRect ? Math.min(anchorRect.bottom + 6, window.innerHeight - 300) : 100;
  const left = anchorRect ? Math.min(anchorRect.left,       window.innerWidth  - 310) : 100;

  const bg       = dark ? 'bg-[#1c2433] border-[#30363d] text-slate-200' : 'bg-white border-slate-200 text-slate-800';
  const inputCls = dark
    ? 'bg-[#21262d] border-[#30363d] text-slate-200 placeholder-slate-500 focus:border-[#00afa9]'
    : 'bg-white border-slate-300 text-slate-800 placeholder-slate-400 focus:border-[#00afa9]';
  const msgBg    = dark ? 'bg-[#21262d]' : 'bg-slate-50';

  return (
    <div
      ref={popRef}
      className={`fixed z-[500] w-72 rounded-xl shadow-2xl border ${bg} flex flex-col overflow-hidden`}
      style={{ top, left }}
    >
      {/* Header */}
      <div className={`flex items-center justify-between px-3 py-2 border-b ${dark ? 'border-[#30363d]' : 'border-slate-100'}`}>
        <div className="flex items-center gap-1.5">
          <MessageSquare size={14} className="text-[#00afa9]" />
          <span className="text-xs font-semibold">Commentaires</span>
          {comments.length > 0 && (
            <span className="text-[10px] bg-[#00afa9] text-white px-1.5 py-0.5 rounded-full font-bold">
              {comments.length}
            </span>
          )}
        </div>
        <button
          onClick={onClose}
          className={`p-1 rounded transition-colors cursor-pointer ${dark ? 'hover:bg-slate-700' : 'hover:bg-slate-100'}`}
        >
          <X size={13} />
        </button>
      </div>

      {/* Liste des commentaires */}
      <div ref={listRef} className="overflow-y-auto max-h-44 px-3 py-2 space-y-2">
        {comments.length === 0 ? (
          <p className={`text-[11px] text-center py-3 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
            Aucun commentaire — soyez le premier !
          </p>
        ) : (
          comments.map(c => (
            <div
              key={c.id}
              className={`rounded-lg px-2.5 py-2 ${msgBg} group transition-opacity ${c._pending ? 'opacity-60' : 'opacity-100'}`}
            >
              <div className="flex items-center justify-between mb-0.5">
                <div className="flex items-center gap-1.5">
                  <span className="text-[11px] font-bold text-[#00afa9]">{c.author}</span>
                  {/* [fix-3] Indicateur "envoi en cours" */}
                  {c._pending && (
                    <Loader2 size={10} className="animate-spin text-slate-400" />
                  )}
                </div>
                <div className="flex items-center gap-1">
                  <span className={`text-[9px] ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
                    {fmtDate(c.date)}
                  </span>
                  {/* [fix-6] Bouton supprimer pour l'auteur ou l'admin */}
                  {!c._pending && (isAdmin || c.author === author) && (
                    <button
                      onClick={() => handleDelete(c.id)}
                      className={`opacity-0 group-hover:opacity-100 transition-opacity p-0.5 rounded cursor-pointer ${dark ? 'hover:bg-red-900/40 text-red-400' : 'hover:bg-red-50 text-red-400'}`}
                      title="Supprimer"
                    >
                      <Trash2 size={10} />
                    </button>
                  )}
                </div>
              </div>
              <p className="text-[12px] leading-relaxed break-words">{c.text}</p>
            </div>
          ))
        )}
      </div>

      {/* Saisie */}
      <div className={`px-3 py-2 border-t ${dark ? 'border-[#30363d]' : 'border-slate-100'}`}>
        <div className="flex gap-1.5">
          {/* [fix-1] input contrôlé avec value + onChange */}
          <input
            ref={inputRef}
            type="text"
            value={inputValue}
            onChange={e => setInputValue(e.target.value)}
            onKeyDown={handleKeyDown}
            placeholder="Ajouter un commentaire…"
            className={`flex-1 border rounded-lg px-2.5 py-1.5 text-[12px] outline-none transition-all focus:ring-2 focus:ring-[#00afa9]/20 ${inputCls}`}
          />
          {/* [fix-4] Désactivé si vide ou envoi en cours */}
          <button
            onClick={handleSend}
            disabled={!inputValue.trim() || sending}
            className="w-8 h-8 rounded-lg bg-[#00afa9] hover:bg-teal-600 disabled:opacity-40 disabled:cursor-not-allowed text-white flex items-center justify-center transition-colors cursor-pointer flex-shrink-0"
          >
            {sending
              ? <Loader2 size={13} className="animate-spin" />
              : <Send size={13} />
            }
          </button>
        </div>
        <p className={`text-[9px] mt-1 ${dark ? 'text-slate-600' : 'text-slate-400'}`}>
          Connecté en tant que{' '}
          <span className="font-semibold text-[#00afa9]">{author}</span>
          {' · '}Entrée pour envoyer
        </p>
      </div>
    </div>
  );
}
