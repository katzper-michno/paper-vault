import { FormEvent, useEffect, useState } from "react";
import { Paper, WebPaper } from "../types";
import axios from "axios";
import { toast } from "react-toastify";
import { WebResultCard } from "./WebResultCard";

interface WebSearchPanelProps {
  open: boolean;
  savedIds: Set<string>;
  onSavedPaperSuccess: (paper: Paper) => void;
}

interface LoadingState {
  search: boolean;
  save: string | null;
}

export const WebSearchPanel: React.FC<WebSearchPanelProps> = ({ 
  open, 
  savedIds, 
  onSavedPaperSuccess 
}) => {
  const SERVER_HOST = import.meta.env.VITE_BACKEND_BASE_URL;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    search: false,
    save: null
  });

  useEffect(() => {
    setSearchResults(prev =>
      (prev) ? (
        prev.map(p =>
          savedIds.has(p.id) ? { ...p, saved: true } : { ...p, saved: false }
        )) : prev
    )
  }, [savedIds]);

  const handleSearch = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(prev => ({ ...prev, search: true }));
    try {
      const res = await axios.get<Paper[]>(`${SERVER_HOST}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (err: any) {
      console.error(err);
      setSearchResults([])
      toast.error(`Error searching papers: ${err.response.data.message}`);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleSavePaper = async (paper: WebPaper): Promise<void> => {
    setLoading(prev => ({ ...prev, save: paper.id }));

    try {
      const res = await axios.post<Paper>(`${SERVER_HOST}/papers`, paper);
      onSavedPaperSuccess(res.data);
    } catch (err: any) {
      console.error('Error saving paper:', err);
      toast.error(`Error saving paper: ${err.response.data.message}`);
    } finally {
      setLoading(prev => ({ ...prev, save: null }));
    }
  };

  return (
    <div className={`web-panel${open ? ' open' : ''}`}>
      <div className="web-panel-inner">
        <div className="web-search-bar">
          <form onSubmit={handleSearch} className="web-input-wrap">
            <input
              type="text"
              placeholder="Search for a paper…"
              value={searchQuery}
              onChange={e => setSearchQuery(e.target.value)}
            />
            <button 
              type="submit"
              disabled={loading.search}
              className="go-btn"
            >
              {loading.search ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        <div className="web-results">
          {
            searchResults.length > 0 ? (
              searchResults.map(p => (
                <WebResultCard
                  key={p.id}
                  isAddingDisabled={loading.save === p.id}
                  paper={p}
                  saved={savedIds.has(p.id)}
                  onSave={handleSavePaper}
                />
              ))) 
              : <div className="empty-state">No papers match your search.</div>
          }
        </div>
      </div>
    </div>
  );
}