import React, { useState, useEffect, useRef, FormEvent } from 'react';
import { Paper, EditFormValues, WebPaper } from './types.ts';
import { EditModal } from './components/EditModal';

import './App.css';
import { WebSearchPanel } from './components/WebSearchPanel.tsx';
import { Slide, toast, ToastContainer } from 'react-toastify';
import axios from 'axios';
import { VaultPanel } from './components/VaultPanel.tsx';

const useTheme = () => {
  const systemTheme = window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';

  const [theme, setTheme] = useState<'light' | 'dark'>(
    () => (localStorage.getItem('theme') as 'light' | 'dark') ?? systemTheme
  );

  useEffect(() => {
    localStorage.setItem('theme', theme);
    document.documentElement.classList.toggle('dark', theme === 'dark');
  }, [theme]);

  return { theme, setTheme };
};

const SIDEBAR_WIDTH = 44;
const defaultWebColWidth = () => Math.round((window.innerWidth - SIDEBAR_WIDTH) * 0.4);

const App: React.FC = () => {
  const { theme, setTheme } = useTheme();
  const toggleTheme = () => setTheme(theme === 'light' ? 'dark' : 'light');

  const SERVER_HOST = import.meta.env.VITE_BACKEND_BASE_URL;

  const [panelOpen, setPanelOpen] = useState(false);
  const [webColWidth, setWebColWidth] = useState(defaultWebColWidth);
  const mainRef = useRef<HTMLDivElement>(null);
  const webColRef = useRef<HTMLDivElement>(null);
  const dragRef = useRef<{ startX: number; startWidth: number } | null>(null);

  const handleResizeMouseDown = (e: React.MouseEvent) => {
    if (!panelOpen) return;
    e.preventDefault();
    dragRef.current = { startX: e.clientX, startWidth: webColWidth };
    if (webColRef.current) webColRef.current.style.transition = 'none';
    mainRef.current?.classList.add('resizing');
    document.body.style.cursor = 'col-resize';
    document.body.style.userSelect = 'none';

    const onMove = (ev: MouseEvent) => {
      if (!dragRef.current || !mainRef.current) return;
      const delta = dragRef.current.startX - ev.clientX;
      const next = Math.max(240, Math.min(dragRef.current.startWidth + delta, window.innerWidth * 0.72));
      mainRef.current.style.setProperty('--web-col-width', `${next}px`);
      setWebColWidth(next);
    };

    const onUp = () => {
      dragRef.current = null;
      if (webColRef.current) webColRef.current.style.transition = '';
      mainRef.current?.classList.remove('resizing');
      document.body.style.cursor = '';
      document.body.style.userSelect = '';
      document.removeEventListener('mousemove', onMove);
      document.removeEventListener('mouseup', onUp);
    };

    document.addEventListener('mousemove', onMove);
    document.addEventListener('mouseup', onUp);
  };

  const [editingPaper, setEditingPaper] = useState<Paper | null>(null);
  const editingPromise = useRef<{ promise?: Promise<void>; resolve?: () => void }>({});

  const [libraryQuery, setLibraryQuery] = useState('');

  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<boolean>(true);

  const savedIds: Set<string> = new Set(savedPapers.map((p: Paper) => p.id));

  const [webQuery, setWebQuery] = useState('');
  const [webResults, setWebResults] = useState<WebPaper[]>([]);
  const [webSearching, setWebSearching] = useState(false);

  useEffect(() => {
    setWebResults((prev) => prev.map((p) => ({ ...p, saved: savedIds.has(p.id) })));
  }, [savedIds]);

  const handleWebSearch = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!webQuery.trim()) return;
    setWebSearching(true);
    try {
      const res = await axios.get<WebPaper[]>(
        `${SERVER_HOST}/search?q=${encodeURIComponent(webQuery)}`
      );
      setWebResults(res.data);
    } catch (err: any) {
      console.error(err);
      setWebResults([]);
      toast.error(`Error searching papers: ${err.response?.data.message || err}`);
    } finally {
      setWebSearching(false);
    }
  };

  useEffect(() => {
    fetchSavedPapers();
  }, []);

  const fetchSavedPapers = async (): Promise<void> => {
    setLoading(true);

    try {
      const res = await axios.get<Paper[]>(`${SERVER_HOST}/papers`);
      setSavedPapers(res.data);
    } catch (err: any) {
      console.error('Error fetching papers from the vault:', err);
      toast.error(`Error fetching papers from the vault ${err.response?.data.message || err}`);
    } finally {
      setLoading(false);
    }
  };

  const handleRemove = async (id: string): Promise<void> => {
    try {
      await axios.delete(`${SERVER_HOST}/papers/${id}`);
      setSavedPapers((prev) => prev.filter((p) => p.id !== id));
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      toast.error(`Error deleting paper ${err.response?.data.message || err}`);
    }
  };

  const handleSave = async (paper: WebPaper): Promise<void> => {
    try {
      const res = await axios.post<Paper>(`${SERVER_HOST}/papers`, paper);
      setSavedPapers((prev) => [...prev, res.data]);
    } catch (err: any) {
      console.error('Error saving paper:', err);
      toast.error(`Error saving paper: ${err.response?.data.message || err}`);
    }
  };

  const handleEdit = async (paperId: string): Promise<void> => {
    const paperToEdit = savedPapers.filter((p) => p.id === paperId)[0];
    const deferred: { promise?: Promise<void>; resolve?: () => void } = {};
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
        openAlex: values.urls.openAlex,
        arxiv: values.urls.arxiv,
        sciHub: values.urls.sciHub,
      },
      abstract: values.abstract,
      note: values.note,
    };

    try {
      await axios.put(`${SERVER_HOST}/papers/${id}`, paper);

      setSavedPapers((prev) => prev.map((p: Paper): Paper => (p.id === id ? paper : p)));
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      toast.error(`Error deleting paper ${err.response.data.message}`);
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
  };

  const handleUpdateNote = async (id: string, note: string | undefined): Promise<void> => {
    const paper = savedPapers.find((p) => p.id === id)!;
    const updated = { ...paper, note };
    try {
      await axios.put(`${SERVER_HOST}/papers/${id}`, updated);
      setSavedPapers((prev) => prev.map((p) => (p.id === id ? updated : p)));
    } catch (err: any) {
      console.error('Error updating note:', err);
      toast.error(`Error updating note: ${err.response?.data.message || err}`);
    }
  };

  const handleAddFile = async (paperId: string, file: File): Promise<void> => {
    try {
      const formData = new FormData();
      formData.append('file', file);

      const res = await axios.post<{ name: string }>(
        `${SERVER_HOST}/papers/${paperId}/files`,
        formData,
        { headers: { 'Content-Type': 'multipart/form-data' } }
      );
      const fileName = res.data.name;

      setSavedPapers((prev) =>
        prev.map((p: Paper) =>
          p.id === paperId
            ? {
                ...p,
                files: [...p.files, fileName],
              }
            : p
        )
      );
    } catch (err: any) {
      console.error('Error adding file:', err);
      toast.error(`Error adding file: ${err.response?.data.message || err}`);
    }
  };

  const handleRemoveFile = async (paperId: string, fileName: string): Promise<void> => {
    try {
      const encodedName = encodeURIComponent(fileName);
      await axios.delete(`${SERVER_HOST}/papers/${paperId}/files/${encodedName}`);

      setSavedPapers((prev) =>
        prev.map((p: Paper) =>
          p.id === paperId
            ? {
                ...p,
                files: p.files.filter((name) => name !== fileName),
              }
            : p
        )
      );
    } catch (err: any) {
      console.error('Error removing file:', err);
      toast.error(`Error removing file: ${err.response?.data.message || err}`);
    }
  };

  const handleOpenFilesDirectory = async (paperId: string): Promise<void> => {
    try {
      await axios.get(`${SERVER_HOST}/papers/${paperId}/files/open`);
    } catch (err: any) {
      console.error('Error opening files directory:', err);
      toast.error(`Error opening files directory: ${err.response?.data.message || err}`);
    }
  };

  const handleOpenFile = async (paperId: string, fileName: string): Promise<void> => {
    try {
      const encodedName = encodeURIComponent(fileName);
      await axios.get(`${SERVER_HOST}/papers/${paperId}/files/${encodedName}/open`);
    } catch (err: any) {
      console.error('Error opening file:', err);
      toast.error(`Error opening file: ${err.response?.data.message || err}`);
    }
  };

  return (
    <div id="root" className={theme === 'dark' ? 'dark' : ''}>
      <div className="app">
        <div
          ref={mainRef}
          className={`main${panelOpen ? ' panel-open' : ''}`}
          style={{ '--web-col-width': `${webColWidth}px` } as React.CSSProperties}
        >
          {/* ── Sidebar ── */}
          <div className="sidebar">
            <button
              className="icon-btn"
              onClick={() =>
                window.alert(
                  'Here, you will be able to manage your vault repository (push, pull, commit).'
                )
              }
            >
              ⎇
            </button>
            <button
              className="icon-btn"
              onClick={() =>
                window.alert('Here, you will be able to modify environment variables.')
              }
            >
              ⚙︎
            </button>
            <button className="icon-btn" onClick={toggleTheme} title="Toggle light/dark mode">
              {theme === 'dark' ? '☽' : '☀'}
            </button>
          </div>

          {/* ── Vault column ── */}
          <VaultPanel
            savedPapers={loading ? undefined : savedPapers}
            searchQuery={libraryQuery}
            onSearchChange={setLibraryQuery}
            filterQuery={libraryQuery.toLowerCase()}
            webPanelOpen={panelOpen}
            webLoading={loading}
            onWebToggle={() => setPanelOpen((o) => !o)}
            onDelete={handleRemove}
            onEdit={handleEdit}
            onUpdateNote={handleUpdateNote}
            onAddFile={handleAddFile}
            onRemoveFile={handleRemoveFile}
            onOpenFilesDirectory={handleOpenFilesDirectory}
            onOpenFile={handleOpenFile}
          />

          {/* ── Web search column ── */}
          <div
            ref={webColRef}
            className={`web-column${panelOpen ? ' open' : ''}`}
            style={{ width: webColWidth }}
          >
            <div className="web-col-resize-handle" onMouseDown={handleResizeMouseDown} />
            <div className="web-col-body">
              <div className="web-search-bar">
                <form onSubmit={handleWebSearch} className="web-input-wrap">
                  <input
                    type="text"
                    placeholder="Search for a paper online…"
                    value={webQuery}
                    onChange={(e) => setWebQuery(e.target.value)}
                  />
                  <button type="submit" disabled={webSearching} className="go-btn">
                    {webSearching ? 'Searching...' : 'Search'}
                  </button>
                </form>
              </div>
              <WebSearchPanel results={webResults} savedIds={savedIds} onSave={handleSave} />
            </div>
          </div>
        </div>
      </div>

      <EditModal paper={editingPaper} onClose={handleCloseModal} onSave={handleSaveEdit} />

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
