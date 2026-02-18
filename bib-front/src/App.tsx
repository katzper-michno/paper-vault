import React, { useState, useEffect, FormEvent, ChangeEvent, ReactNode } from 'react';
import './App.css';
import axios from 'axios';
import BibTeXModal from './BibTeXModal/BibTeXModal';

interface Paper {
  id: string;
  title: string;
  authors: string[];
  abstract: string;
  year: number;
  venue: string;
  doi: string;
  url: string;
  saved: boolean;
}

interface LoadingState {
  search: boolean;
  save: string | null;
  delete: string | null;
  load: boolean;
}

const App: React.FC = () => {
  const SERVER_HOST = process.env.REACT_APP_BACKEND_BASE_URL;

  const [searchQuery, setSearchQuery] = useState<string>('');
  const [searchResults, setSearchResults] = useState<Paper[] | string>([]);
  const [savedPapers, setSavedPapers] = useState<Paper[] | string>([]);
  const [filterQuery, setFilterQuery] = useState<string>('');
  const [loading, setLoading] = useState<LoadingState>({
    search: false,
    save: null,
    delete: null,
    load: false
  });

  // Load saved papers on component mount
  useEffect(() => {
    fetchSavedPapers();
  }, []);

  // Fetch saved papers from database
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

  const handleSearch = async (e: FormEvent<HTMLFormElement>): Promise<void> => {
    e.preventDefault();
    if (!searchQuery.trim()) return;

    setLoading(prev => ({ ...prev, search: true }));
    try {
      const res = await axios.get<Paper[]>(`${SERVER_HOST}/search?q=${encodeURIComponent(searchQuery)}`);
      setSearchResults(res.data);
    } catch (err: any) {
      console.error(err);
      setSearchResults(err.response.data.message);
    } finally {
      setLoading(prev => ({ ...prev, search: false }));
    }
  };

  const handleSavePaper = async (paper: Paper): Promise<void> => {
    setLoading(prev => ({ ...prev, save: paper.id }));

    try {
      const res = await axios.post<Paper>(`${SERVER_HOST}/papers`, paper);

      setSavedPapers(prev => (Array.isArray(prev) ? [res.data, ...prev] : [res.data]))

      setSearchResults(prev =>
        (Array.isArray(prev)) ? (
          prev.map(p =>
            p.id === paper.id ? { ...p, saved: true } : p
          )) : prev
      );
    } catch (err: any) {
      console.error('Error saving paper:', err);
      setSavedPapers(`Error saving paper: ${err}`);
    } finally {
      setLoading(prev => ({ ...prev, save: null }));
    }
  };

  const handleDeletePaper = async (paper: Paper): Promise<void> => {
    setLoading(prev => ({ ...prev, delete: paper.id }));

    try {
      await axios.delete(`${SERVER_HOST}/papers/${paper.id}`);

      setSavedPapers(prev => (Array.isArray(prev) ? prev.filter((p: Paper) => p.id !== paper.id) : prev));

      setSearchResults(prev =>
        (Array.isArray(prev)) ? (
          prev.map(p =>
            p.id === paper.id ? { ...p, saved: false } : p
          )) : prev
      );
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      setSavedPapers(`Error deleting paper: ${err}`)
    } finally {
      setLoading(prev => ({ ...prev, delete: null }));
    }
  };

  const filteredSavedPapers: Paper[] = Array.isArray(savedPapers) ?
    savedPapers.filter(paper =>
      paper.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      paper.authors.join(' ').toLowerCase().includes(filterQuery.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(filterQuery.toLowerCase())
    ) : [];

  const searchResultsDiv = (): ReactNode => {
    if (loading.search) {
      return <div className="loading">Searching for papers...</div>;
    }
    else if (Array.isArray(searchResults) && searchResults.length === 0) {
      return <p className="no-results">No results found</p>;
    } else if (Array.isArray(searchResults)) {
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
    } else {
      return <div className="error">Error: {searchResults}</div>;
    }
  }

  const savedPapersDiv = (): ReactNode => {
    if (loading.load) {
      return <div className="loading">Loading saved papers...</div>;
    }
    else if (Array.isArray(savedPapers)) {
      if (filteredSavedPapers.length === 0 && filterQuery) {
        return <p className="no-results">No matching papers found</p>;
      } else if (filteredSavedPapers.length === 0) {
        return <p className="no-results">No saved papers yet</p>;
      } else {
        return (
          <div className="saved-list">
            {
              filteredSavedPapers.map(paper => (
                <SavedPaperCard
                  key={paper.id}
                  paper={paper}
                  filterQuery={filterQuery}
                  onDelete={() => handleDeletePaper(paper)}
                  isDeleting={loading.delete === paper.id}
                />
              ))
            }
          </div>
        )
      }
    } else {
      return <div className="error">Error: {savedPapers}</div>;
    }
  }

  return (
    <div className="app">
      <div className="main-container">
        {/* Search Section */}
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
        </section>

        {/* Saved Papers Section */}
        <section className="saved-section">
          <h2>Saved Papers</h2>

          {/* Filter Input */}
          <div className="filter-container">
            <input
              type="text"
              value={filterQuery}
              onChange={(e: ChangeEvent<HTMLInputElement>) => setFilterQuery(e.target.value)}
              placeholder="Filter saved papers by title..."
              className="filter-input"
              aria-label="Filter saved papers"
            />
          </div>

          {/* Saved Papers List */}
          <div className="saved-container">
            {savedPapersDiv()}
          </div>
        </section>
      </div>
    </div>
  );
};

interface PaperCardProps {
  paper: Paper;
  onSave: () => void;
  isSaving: boolean;
  isSaved: boolean;
}

const PaperCard: React.FC<PaperCardProps> = ({ paper, onSave, isSaving, isSaved }) => {
  const renderAuthors = (authors?: string[]): string => {
    if (!authors || authors.length === 0) return 'Unknown authors';

    if (typeof authors[0] === 'string') {
      return (authors as string[]).join(', ');
    }

    return authors.join(', ');
  };

  return (
    <article className="paper-card">
      <div className="paper-content">
        <h4 className="paper-title">{paper.title}</h4>
        {paper.authors && (
          <p className="paper-authors">
            <strong>Authors:</strong> {renderAuthors(paper.authors)}
          </p>
        )}
        {paper.abstract && (
          <p className="paper-abstract">{paper.abstract}</p>
        )}
        {paper.year && (
          <p className="paper-year">
            <strong>Year:</strong> {paper.year}
          </p>
        )}
        {paper.venue && (
          <p className="paper-venue">
            <strong>Venue:</strong> {paper.venue}
          </p>
        )}
        {paper.doi && (
          <p className="paper-doi">
            <strong>DOI:</strong> {paper.doi}
          </p>
        )}
        {paper.url && (
          <p className="paper-url">
            <strong>URL:</strong> <a href={paper.url} target="_blank" rel="noopener noreferrer">{paper.url}</a>
          </p>
        )}
      </div>
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

const HighlightedText: React.FC<{ text: string, query: string }> = ({ text, query }) => {
  if (!query) return <>{text}</>;

  const regex = new RegExp(`(${query})`, "gi");

  const parts = text.split(regex);

  return (
    <>
      {parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} style={{ backgroundColor: "yellow" }}>
            {part}
          </span>
        ) : (
          part
        )
      )}
    </>
  );
};

interface SavedPaperCardProps {
  paper: Paper;
  filterQuery: string;
  onDelete: () => void;
  isDeleting: boolean;
}

const SavedPaperCard: React.FC<SavedPaperCardProps> = ({ paper, filterQuery, onDelete, isDeleting }) => {
  const renderAuthors = (): string => {
    if (paper.authors.length === 0) return 'Unknown authors';
    else return paper.authors.join(', ');
  }

  return (
    <article className="saved-paper-card">
      <div className="paper-content">
        <h4 className="paper-title">
          <HighlightedText text={paper.title} query={filterQuery} />
        </h4>
        {paper.authors && (
          <p className="paper-authors">
            <strong>Authors: </strong>
            <HighlightedText text={renderAuthors()} query={filterQuery} />
          </p>
        )}
        {paper.abstract && (
          <p className="paper-abstract">
            <HighlightedText text={paper.abstract} query={filterQuery} />
          </p>
        )}
        {paper.year && (
          <p className="paper-year">
            <strong>Year:</strong> {paper.year}
          </p>
        )}
        {paper.venue && (
          <p className="paper-venue">
            <strong>Venue:</strong> {paper.venue}
          </p>
        )}
        {paper.doi && (
          <p className="paper-doi">
            <strong>DOI:</strong> {paper.doi}
          </p>
        )}
        {paper.url && (
          <p className="paper-url">
            <strong>URL:</strong> <a href={paper.url} target="_blank" rel="noopener noreferrer">{paper.url}</a>
          </p>
        )}
      </div>
      <div className="paper-actions">
        <BibTeXModal paperId={paper.id} />
        <button
          onClick={onDelete}
          disabled={isDeleting}
          className={'delete-button'}
        >
          {isDeleting ? 'Deleting...' : 'Delete'}
        </button>
      </div>
    </article>
  );
};

export default App;
