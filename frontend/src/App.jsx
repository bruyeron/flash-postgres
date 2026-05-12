/**
 * src/App.jsx
 *
 * MODIFICATION PAR RAPPORT À L'ORIGINAL :
 *  [fix-1] Reçoit la prop `onActivityChange` depuis main.jsx
 *  [fix-2] Appelle onActivityChange chaque fois que selectedGroup change
 *          → le CommentProvider dans main.jsx reçoit l'activité courante
 *          → les commentaires de la bonne activité sont chargés depuis l'API
 *
 * Tout le reste (chargement CSV, changement de groupe, dark mode) est inchangé.
 */

import { useState, useCallback, useEffect } from 'react';
import { useAuth } from './context/AuthContext';
import TopBar    from './components/TopBar';
import EmptyState from './components/EmptyState';
import DataTable  from './components/DataTable';
import Legend     from './components/Legend';
import Loading    from './components/Loading';
import { parseCSV }   from './utils/csvParser';
import { buildIndex } from './utils/dataProcessor';

// [fix-1] onActivityChange reçu depuis main.jsx → Root → CommentProvider
export default function App({ onActivityChange }) {
  const [dark, setDark]                       = useState(false);
  const [rawData, setRawData]                 = useState([]);
  const [allGroups, setAllGroups]             = useState([]);
  const [selectedGroup, setSelectedGroup]     = useState('');
  const [collapseState, setCollapseState]     = useState({});
  const [dataIdx, setDataIdx]                 = useState(null);
  const [loading, setLoading]                 = useState(false);
  const [statusMsg, setStatusMsg]             = useState('Aucun fichier chargé');

  const { token, isAuthenticated, isAdmin, user } = useAuth();
  const allowedServices = isAdmin ? null : (user?.services || []);

  const handleToggle = useCallback((key) => {
    setCollapseState((prev) => ({ ...prev, [key]: !prev[key] }));
  }, []);

  // [fix-2] Notifier le parent à chaque changement d'activité
  const handleGroupChange = useCallback((g) => {
    setSelectedGroup(g);
    setCollapseState({});
    if (rawData.length > 0) setDataIdx(buildIndex(rawData, g));
    onActivityChange?.(g); // → met à jour currentActivity dans Root → CommentProvider
  }, [rawData, onActivityChange]);

  const handleAutoLoad = useCallback(async () => {
    if (!token) return;
    setLoading(true);
    setStatusMsg('Chargement…');
    try {
      const res = await fetch('/api/csv/data', {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (!res.ok) {
        const err = await res.json();
        throw new Error(err.detail || `HTTP ${res.status}`);
      }
      applyCSV(await res.text());
    } catch (err) {
      console.error('Erreur chargement CSV:', err);
      setStatusMsg(`Erreur : ${err.message}`);
    } finally {
      setLoading(false);
    }
  }, [token, isAdmin, allowedServices]);

  useEffect(() => {
    if (isAuthenticated) handleAutoLoad();
  }, [isAuthenticated, handleAutoLoad]);

  function applyCSV(csvText) {
    const parsed = parseCSV(csvText);
    let groups = [...new Set(parsed.map((r) => r.groupe_suivi).filter(Boolean)
      .filter(g => g !== 'ARO' && g!== 'Autres'))].sort();
    console.log(`groups => ${groups}`)
    if (!isAdmin && allowedServices) {
      groups = groups.filter(g => allowedServices.includes(g));
    }
    const first = groups[0] || '';
    console.log(`first item is ${first}`)
    setRawData(parsed);
    setAllGroups(groups);
    setSelectedGroup(first);
    setCollapseState({});
    setDataIdx(buildIndex(parsed, first));
    setStatusMsg(`${parsed.length} lignes · ${groups.length} activité(s)`);
    // [fix-2] Notifier le premier groupe sélectionné automatiquement
    onActivityChange?.(first);
  }

  const handleFileLoad = useCallback(async (file) => {
    if (!file) return;
    setLoading(true);
    setStatusMsg('Traitement du fichier…');
    try {
      const formData = new FormData();
      formData.append('file', file);
      const res = await fetch('/api/csv/upload', {
        method: 'POST',
        headers: { Authorization: `Bearer ${token}` },
        body: formData,
      });
      if (!res.ok) throw new Error((await res.json()).detail);
      await handleAutoLoad();
    } catch (err) {
      console.warn('Upload backend échoué, lecture locale :', err.message);
      const reader = new FileReader();
      reader.onload = (ev) => { applyCSV(ev.target.result); setLoading(false); };
      reader.readAsText(file, 'UTF-8');
    }
  }, [token, handleAutoLoad]);

  const bg = dark ? 'bg-[#0d1117] text-slate-200' : 'bg-[#f5f7fa] text-slate-800';

  const sortedWeeks = dataIdx?.sortedDates
    ? [...new Set(dataIdx.sortedDates.map(d => dataIdx.dateWeek[d]))]
    : [];

  return (
    <div className={`${bg} font-[Poppins,sans-serif] text-[13px] h-screen flex flex-col overflow-hidden`}>
      <TopBar
        dark={dark}
        onToggleTheme={() => setDark(v => !v)}
        allGroups={allGroups}
        selectedGroup={selectedGroup}
        onGroupChange={handleGroupChange}
        statusMsg={statusMsg}
        onFileLoad={handleFileLoad}
        sortedWeeks={sortedWeeks}
        currentActivity={selectedGroup}
      />
      <div className="flex-1 flex flex-col overflow-hidden">
        {!dataIdx
          ? <EmptyState dark={dark} />
          : (
            <DataTable
              dataIdx={dataIdx}
              collapseState={collapseState}
              onToggle={handleToggle}
              dark={dark}
              currentActivity={selectedGroup}
            />
          )
        }
      </div>
      {dataIdx && <Legend dark={dark} currentActivity={selectedGroup} />}
      {loading && <Loading dark={dark} message="Traitement des données…" />}
    </div>
  );
}
