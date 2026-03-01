import React, { useState, FormEvent, ChangeEvent, ReactNode, useEffect } from 'react';
import './Search.css';
import axios from 'axios';
import { Paper } from './../types';
import { toast } from 'react-toastify';
import PaperInfo from '../PaperInfo/PaperInfo';

interface SearchProps {
  savedPapers: undefined | Paper[];
  onSavedPaperSuccess: (paper: Paper) => void;
}

interface LoadingState {
  search: boolean;
  save: string | null;
}

const Search = ({ savedPapers, onSavedPaperSuccess }: SearchProps) => {
  const SERVER_HOST = process.env.REACT_APP_BACKEND_BASE_URL;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<LoadingState>({
    search: false,
    save: null
  });

  useEffect(() => {
    const savedIds = savedPapers ? savedPapers.map((p: Paper) => p.id) : [];
    setSearchResults(prev =>
      (prev) ? (
        prev.map(p =>
          savedIds.includes(p.id) ? { ...p, saved: true } : { ...p, saved: false }
        )) : prev
    )
  }, [savedPapers]);

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

  const handleSavePaper = async (paper: Paper): Promise<void> => {
    setLoading(prev => ({ ...prev, save: paper.id }));

    try {
      const res = await axios.post<Paper>(`${SERVER_HOST}/papers`, paper);
      // setSearchResults(prev =>
      //   (prev) ? (
      //     prev.map(p =>
      //       p.id === paper.id ? { ...p, saved: true } : p
      //     )) : prev
      // );
      onSavedPaperSuccess(res.data);
    } catch (err: any) {
      console.error('Error saving paper:', err);
      toast.error(`Error saving paper: ${err.response.data.message}`);
    } finally {
      setLoading(prev => ({ ...prev, save: null }));
    }
  };

  const searchResultsDiv = (): ReactNode => {
    if (loading.search) {
      return <div className="loading">Searching for papers...</div>;
    }
    else if (searchResults.length === 0) {
      return <p className="no-results">No results found</p>;
    } else {
      return <div className="results-list">
        {searchResults.map(paper => (
          <PaperCard
            key={paper.id}
            paper={paper}
            onSave={() => handleSavePaper(paper)}
            isSaving={loading.save === paper.id}
            isSaved={paper.saved || false}
          />
        ))}
      </div>;
    }
  }

  return (
    <section className="search-section">
      <h2>Search Papers</h2>
      <form onSubmit={handleSearch} className="search-form">
        <input
          type="text"
          value={searchQuery}
          onChange={(e: ChangeEvent<HTMLInputElement>) => setSearchQuery(e.target.value)}
          placeholder="Enter your search query..."
          className="search-input"
          aria-label="Search papers"
        />
        <button
          type="submit"
          disabled={loading.search}
          className="search-button"
        >
          {loading.search ? 'Searching...' : 'Search'}
        </button>
      </form>

      {/* Search Results */}
      <div className="results-container">
        <h3>Search Results</h3>
        {searchResultsDiv()}
      </div>
    </section >
  );
}

interface PaperCardProps {
  paper: Paper;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

const PaperCard: React.FC<PaperCardProps> = ({ paper, onSave, isSaving, isSaved }) => {
  return (
    <article className="paper-card">
      <PaperInfo paper={paper} filterQuery="" />
      <div className="paper-actions">
        <button
          onClick={onSave}
          disabled={isSaving || isSaved}
          className={`save-button ${isSaved ? 'saved' : ''}`}
          aria-label={isSaved ? 'Already saved' : 'Save paper'}
        >
          {isSaving ? 'Saving...' : isSaved ? 'Saved' : 'Save'}
        </button>
      </div>
    </article>
  );
};

export default Search;
