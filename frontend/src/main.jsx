/**
 * src/main.jsx
 *
 * MODIFICATIONS :
 *  [fix-1] CommentProvider déplacé DANS AuthProvider (était à l'extérieur)
 *          → permet à CommentContext d'accéder au token via useAuth()
 *  [fix-2] Root gère currentActivity et le transmet à CommentProvider
 *          → le contexte sait quelle activité charger depuis l'API
 *  [fix-3] <App> reçoit onActivityChange pour remonter le groupe sélectionné
 */

import { StrictMode, useState } from 'react';
import { createRoot } from 'react-dom/client';
import './index.css';
import App from './App';
import Login from './components/Login';
import { AuthProvider, useAuth } from './context/AuthContext';
import { CommentProvider } from './context/CommentContext';

function Root() {
  const { isLoading, isAuthenticated } = useAuth();

  // [fix-2] état local qui suit l'activité courante choisie dans App
  const [currentActivity, setCurrentActivity] = useState('');

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-100">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-t-2 border-[#00afa9]" />
      </div>
    );
  }

  if (!isAuthenticated) return <Login />;

  return (
    // [fix-1] CommentProvider est maintenant DANS AuthProvider → accès au token
    // [fix-2] currentActivity transmis → rechargement auto des commentaires
    <CommentProvider currentActivity={currentActivity}>
      <App onActivityChange={setCurrentActivity} />
    </CommentProvider>
  );
}

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {/* AuthProvider est le parent → fournit token à tout le monde */}
    <AuthProvider>
      <Root />
    </AuthProvider>
  </StrictMode>
);
