import { FormEvent, useEffect, useState } from "react";
import { Paper, WebPaper } from "../types";
import axios from "axios";
import { toast } from "react-toastify";
import { WebResultCard } from "./WebResultCard";

interface WebSearchPanelProps {
  isOpen: boolean;
  savedIds: Set<string>;
  onSave: (paper: WebPaper) => Promise<void>;
}

export const WebSearchPanel: React.FC<WebSearchPanelProps> = ({
  isOpen,
  savedIds,
  onSave
}) => {
  const SERVER_HOST = import.meta.env.VITE_BACKEND_BASE_URL;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [searching, setSearching] = useState<boolean>(false);

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

    setSearching(true);

    try {
      const res = await axios.get<Paper[]>(`${SERVER_HOST}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (err: any) {
      console.error(err);
      setSearchResults([])
      toast.error(`Error searching papers: ${err.response?.data.message || err}`);
    } finally {
      setSearching(false);
    }
  };

  return (
    <div className={`web-panel${isOpen ? ' open' : ''}`}>
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
              disabled={searching}
              className="go-btn"
            >
              {searching ? 'Searching...' : 'Search'}
            </button>
          </form>
        </div>

        <div className="web-results">
          {
            searchResults.length > 0 ? (
              searchResults.map(p => (
                <WebResultCard
                  key={p.id}
                  paper={p}
                  isSaved={savedIds.has(p.id)}
                  onSave={onSave}
                />
              )))
              : <div className="empty-state">No papers match your search.</div>
          }
        </div>
      </div>
    </div>
  );
}
