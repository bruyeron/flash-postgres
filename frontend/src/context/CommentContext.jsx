/**
 * src/context/CommentContext.jsx
 *
 * MODIFICATIONS PAR RAPPORT À L'ORIGINAL (localStorage) :
 *
 *  [fix-1] Plus de localStorage — stockage PostgreSQL via API backend
 *  [fix-2] CommentProvider reçoit currentActivity en prop
 *          → useEffect recharge les commentaires à chaque changement d'activité
 *  [fix-3] addComment : mise à jour locale IMMÉDIATE (optimistic update)
 *          + appel API en arrière-plan → le commentaire s'affiche instantanément
 *          sans attendre la réponse serveur, puis se synchronise
 *  [fix-4] Gestion d'erreur : rollback local si l'API échoue
 *  [fix-5] deleteComment exposé dans le contexte (était absent)
 *  [fix-6] État loading exposé pour afficher un spinner pendant le chargement
 */

import {
  createContext, useContext, useState,
  useCallback, useEffect, useRef,
} from 'react';
import { useAuth } from './AuthContext';

const CommentContext = createContext(null);

export function CommentProvider({ children, currentActivity }) {
  const { token } = useAuth();

  // { cell_key → [{ id, author, text, date }, ...] }
  const [comments, setComments] = useState({});
  const [loading, setLoading]   = useState(false);

  // Ref pour éviter des appels en double lors du montage strict-mode
  const loadingRef = useRef(false);

  // ── [fix-2] Chargement depuis l'API ──────────────────────────────────────
  const loadComments = useCallback(async () => {
    if (!token || !currentActivity || loadingRef.current) return;
    loadingRef.current = true;
    setLoading(true);
    try {
      const res = await fetch(
        `/api/comments/${encodeURIComponent(currentActivity)}`,
        { headers: { Authorization: `Bearer ${token}` } }
      );
      if (!res.ok) throw new Error(`HTTP ${res.status}`);

      // L'API retourne un tableau plat : [{ id, cell_key, activity, author, text, date }]
      // On regroupe par cell_key pour un accès O(1) dans DataTable
      const list = await res.json();
      const indexed = {};
      list.forEach(c => {
        if (!indexed[c.cell_key]) indexed[c.cell_key] = [];
        indexed[c.cell_key].push(c);
      });
      setComments(indexed);
    } catch (err) {
      console.error('[CommentContext] Erreur chargement commentaires:', err);
    } finally {
      setLoading(false);
      loadingRef.current = false;
    }
  }, [token, currentActivity]);

  // Recharger dès que l'activité change ou que le token arrive
  useEffect(() => {
    setComments({}); // vider les commentaires de l'activité précédente
    loadComments();
  }, [loadComments]);

  // ── Lecture ───────────────────────────────────────────────────────────────
  const getComments = useCallback(
    (cellKey) => comments[cellKey] || [],
    [comments]
  );

  const hasComment = useCallback(
    (cellKey) => (comments[cellKey] || []).length > 0,
    [comments]
  );

  // ── [fix-3] Ajout avec optimistic update ─────────────────────────────────
  const addComment = useCallback(async (cellKey, _author, text) => {
    if (!token || !currentActivity || !text?.trim()) return;

    // 1. Commentaire temporaire affiché IMMÉDIATEMENT
    const tempId = `temp_${Date.now()}`;
    const tempComment = {
      id:       tempId,
      cell_key: cellKey,
      activity: currentActivity,
      author:   _author,
      text:     text.trim(),
      date:     new Date().toISOString(),
      _pending: true, // flag visuel "en cours d'envoi"
    };

    // Mise à jour locale instantanée → commentaire visible de suite
    setComments(prev => ({
      ...prev,
      [cellKey]: [...(prev[cellKey] || []), tempComment],
    }));

    try {
      // 2. Envoi à l'API
      const res = await fetch('/api/comments', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify({
          cell_key: cellKey,
          activity: currentActivity,
          text: text.trim(),
        }),
      });

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const confirmed = await res.json();

      // 3. Remplacer le commentaire temporaire par celui confirmé par le serveur
      setComments(prev => ({
        ...prev,
        [cellKey]: (prev[cellKey] || []).map(c =>
          c.id === tempId ? confirmed : c
        ),
      }));
    } catch (err) {
      console.error('[CommentContext] Erreur envoi commentaire:', err);
      // [fix-4] Rollback : retirer le commentaire temporaire en cas d'erreur
      setComments(prev => ({
        ...prev,
        [cellKey]: (prev[cellKey] || []).filter(c => c.id !== tempId),
      }));
    }
  }, [token, currentActivity]);

  // ── [fix-5] Suppression ───────────────────────────────────────────────────
  const deleteComment = useCallback(async (commentId, cellKey) => {
    if (!token) return;

    // Optimistic : retirer localement avant la réponse API
    setComments(prev => ({
      ...prev,
      [cellKey]: (prev[cellKey] || []).filter(c => c.id !== commentId),
    }));

    try {
      const res = await fetch(`/api/comments/${commentId}`, {
        method: 'DELETE',
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
    } catch (err) {
      console.error('[CommentContext] Erreur suppression:', err);
      // Recharger pour resynchroniser si la suppression a échoué
      loadComments();
    }
  }, [token, loadComments]);

  return (
    <CommentContext.Provider value={{
      getComments,
      addComment,
      deleteComment,
      hasComment,
      loading,
      reloadComments: loadComments,
    }}>
      {children}
    </CommentContext.Provider>
  );
}

export function useComments() {
  const ctx = useContext(CommentContext);
  if (!ctx) throw new Error('useComments doit être dans <CommentProvider>');
  return ctx;
}
