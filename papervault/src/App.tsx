import React, { useState, useEffect, useRef } from 'react';
import { Paper, EditFormValues, WebPaper } from './types.ts';
import { EditModal } from './components/EditModal';

import './App.css';
import { WebSearchPanel } from './components/WebSearchPanel.tsx';
import { Slide, toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { VaultPanel } from './components/VaultPanel.tsx';

const useTheme = () => {
  const systemTheme = window.matchMedia("(prefers-color-scheme: dark)").matches ? "dark" : "light";

  const [theme, setTheme] = useState<"light" | "dark">(
    () => (localStorage.getItem("theme") as "light" | "dark") ?? systemTheme
  );

  useEffect(() => {
    localStorage.setItem("theme", theme);
    document.documentElement.classList.toggle("dark", theme === "dark"); // if using Tailwind
  }, [theme]);

  return { theme, setTheme };
}

const App: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const SERVER_HOST = import.meta.env.VITE_BACKEND_BASE_URL;

  const [panelOpen, setPanelOpen] = useState(false);

  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const editingPromise = useRef<{ promise?: Promise<void>, resolve?: () => void }>({})

  const [libraryQuery, setLibraryQuery] = useState('');

  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const savedIds: Set<string> = new Set(savedPapers.map((p: Paper) => p.id));

  useEffect(() => {
    fetchSavedPapers()
  }, []);

  const fetchSavedPapers = async (): Promise<void> => {
    setLoading(true);

    try {
      const res = await axios.get<Paper[]>(`${SERVER_HOST}/papers`);
      setSavedPapers(res.data);
    } catch (err: any) {
      console.error('Error fetching papers from the vault:', err);
      toast.error(`Error fetching papers from the vault ${err.response?.data.message || err}`)
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string): Promise<void> => {
    try {
      await axios.delete(`${SERVER_HOST}/papers/${id}`);
      setSavedPapers(prev => prev.filter(p => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      toast.error(`Error deleting paper ${err.response?.data.message || err}`)
    }
  };

  const handleSave = async (paper: WebPaper): Promise<void> => {
    try {
      const res = await axios.post<Paper>(`${SERVER_HOST}/papers`, paper);
      setSavedPapers(prev => [res.data, ...prev]);
    } catch (err: any) {
      console.error('Error saving paper:', err);
      toast.error(`Error saving paper: ${err.response?.data.message || err}`);
    }
  };

  const handleEdit = async (paperId: string): Promise<void> => {
    const paperToEdit = savedPapers.filter(p => p.id === paperId)[0];
    const deferred: { promise?: Promise<void>, resolve?: () => void } = {};
    deferred.promise = new Promise((res, _) => {
      deferred.resolve = res;
    });
    editingPromise.current = deferred;
    setEditingPaper(paperToEdit);
    return editingPromise.current.promise;
  };

  const handleSaveEdit = async (id: string, values: EditFormValues): Promise<void> => {
    let paper: Paper = savedPapers.find((p: Paper) => p.id === id)!;

    paper = {
      ...paper,
      title: values.title,
      authors: values.authors,
      venue: values.venue,
      year: values.year,
      doi: values.doi,
      urls: {
        arxiv: values.urls.arxiv,
        semanticScholar: values.urls.semanticScholar
      },
      abstract: values.abstract
    }

    try {
      await axios.put(`${SERVER_HOST}/papers/${id}`, paper);

      setSavedPapers(prev =>
        prev.map((p: Paper): Paper =>
          p.id === id
            ? paper : p
        )
      );
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      toast.error(`Error deleting paper ${err.response.data.message}`)
    } finally {
      setEditingPaper(null);
      editingPromise.current.resolve!();
      editingPromise.current = {};
    }
  };

  const handleCloseModal = () => {
    setEditingPaper(null);
    editingPromise.current.resolve!();
    editingPromise.current = {};
  }

  return (
    <div id="root" className={theme === 'dark' ? 'dark' : ''}>
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
              onClick={toggleTheme}
              title="Toggle light/dark mode"
            >
              {theme === 'dark' ? '☽' : '☀'}
            </button>

            <button
              disabled={loading}
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

        <div className="main">
          <VaultPanel
            savedPapers={loading ? undefined : savedPapers}
            filterQuery={libraryQuery.toLowerCase()}
            onDelete={handleRemove}
            onEdit={handleEdit}
          />

          {/* Divider */}
          <div className={`divider${panelOpen ? ' visible' : ''}`} />

          <WebSearchPanel
            isOpen={!loading && panelOpen}
            savedIds={savedIds}
            onSave={handleSave}
          />
        </div>
      </div>

      <EditModal
        paper={editingPaper}
        onClose={handleCloseModal}
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
