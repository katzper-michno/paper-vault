import React, { useState, useCallback, useEffect } from 'react';
import { Paper, WebPaper, EditFormValues } from './types.ts';
import { PaperCard } from './components/PaperCard.tsx';
import { EditModal } from './components/EditModal';

import './App.css';
import { WebSearchPanel } from './components/WebSearchPanel.tsx';
import { Slide, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { VaultPanel } from './components/VaultPanel.tsx';

interface LoadingState {
  load: boolean;
}

const App: React.FC = () => {
  const SERVER_HOST = import.meta.env.VITE_BACKEND_BASE_URL;

  const [panelOpen, setPanelOpen] = useState(false);
  const [dark, setDark] = useState(false);
  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const [libraryQuery, setLibraryQuery] = useState('');

  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ load: false });

  const savedIds: Set<string> = new Set(savedPapers.map((p : Paper) => p.id));

  useEffect(() => {
    fetchSavedPapers();
  }, []);

  const fetchSavedPapers = async (): Promise<void> => {
    setLoading(prev => ({ ...prev, load: true }));
    try {
      const res = await axios.get<Paper[]>(`${SERVER_HOST}/papers`);
      setSavedPapers(res.data);
    } catch (err: any) {
      console.error(err);
      setSavedPapers(err.response.data.message);
    } finally {
      setLoading(prev => ({ ...prev, load: false }));
    }
  };

  const handleRemove = useCallback((id: string) => {
    setSavedPapers(prev => prev.filter(p => p.id !== id));
  }, []);

  const handleSaved = useCallback((paper: Paper) => {
    setSavedPapers(prev => [paper, ...prev]);
  }, []);

  /* const handleEdit = useCallback((paper: Paper) => {
    setEditingPaper(paper);
  }, []);*/

  const handleSaveEdit = useCallback((id: string, values: EditFormValues) => {
    setSavedPapers(prev =>
      prev.map(p =>
        p.id === id
          ? {
              ...p,
              title: values.title,
              authors: values.authors,
              venue: values.venue,
              year: values.year,
              doi: values.doi,
              arxiv: values.urls.arxiv || null,
              ss: values.urls.semanticScholar || null,
              abstract: values.abstract,
            }
          : p
      )
    );
    setEditingPaper(null);
  }, []);

  return (
    <div id="root" className={dark ? 'dark' : ''}>
      <div className="app">
        {/* ── Topbar ── */}
        <div className="topbar">
          <div className="search-wrap">
            <span className="search-icon">⌕</span>
            <input
              type="text"
              placeholder="Search your library…"
              value={libraryQuery}
              onChange={e => setLibraryQuery(e.target.value)}
            />
          </div>

          <div className="topbar-right">
            <button
              className="icon-btn"
              onClick={() => setDark(d => !d)}
              title="Toggle light/dark mode"
            >
              {dark ? '☽' : '☀'}
            </button>

            <button
              disabled={loading.load}
              className={`web-toggle${panelOpen ? ' active' : ''}`}
              onClick={() => setPanelOpen(o => !o)}
            >
              <span className="dot" />
              <span>{panelOpen ? 'Hide web search' : 'Web search'}</span>
              <span className="toggle-arrow" style={{ transform: panelOpen ? 'rotate(180deg)' : '' }}>
                ›
              </span>
            </button>
          </div>
        </div>

        {/* ── Main ── */}
        <div className="main">
          {/* Library panel */}
          <VaultPanel 
            savedPapers={loading.load ? undefined : savedPapers}
            filterQuery={libraryQuery.toLowerCase()}
            onDeletedPaperSuccess={handleRemove}
          />

          {/* Divider */}
          <div className={`divider${panelOpen ? ' visible' : ''}`} />

          {/* Web search panel */}
          <WebSearchPanel
            open={!loading.load && panelOpen}
            savedIds={savedIds}
            onSavedPaperSuccess={handleSaved} 
          />
        </div>
      </div>

      {/* Edit modal */}
      <EditModal
        paper={editingPaper}
        onClose={() => setEditingPaper(null)}
        onSave={handleSaveEdit}
      />

      <ToastContainer
          position="bottom-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          transition={Slide}
        />
    </div>
  );
};

export default App;