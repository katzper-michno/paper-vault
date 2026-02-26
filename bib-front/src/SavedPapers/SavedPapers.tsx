import React, { useState, useEffect, FormEvent, ChangeEvent, ReactNode } from 'react';
import './SavedPapers.css';
import axios from 'axios';
import BibTeXModal from './../BibTeXModal/BibTeXModal';
import { Paper } from './../types';
import { toast } from 'react-toastify';

interface LoadingState {
  delete: string | null;
}

interface SavedPapersProps {
  savedPapers?: undefined | Paper[];
  onDeletedPaperSuccess: (deletedId: string) => void;
}

const SavedPapers = ({ savedPapers, onDeletedPaperSuccess }: SavedPapersProps) => {
  const SERVER_HOST = process.env.REACT_APP_BACKEND_BASE_URL;

  const [filterQuery, setFilterQuery] = useState<string>('');
  const [loading, setLoading] = useState<LoadingState>({
    delete: null,
  });

  const handleDeletePaper = async (paper: Paper): Promise<void> => {
    setLoading(prev => ({ ...prev, delete: paper.id }));

    try {
      await axios.delete(`${SERVER_HOST}/papers/${paper.id}`);
      onDeletedPaperSuccess(paper.id);
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      toast.error(`Error deleting paper ${err.response.data.message}`)
    } finally {
      setLoading({ delete: null });
    }
  };

  const filteredSavedPapers: Paper[] = (savedPapers) ?
    savedPapers.filter(paper =>
      paper.title.toLowerCase().includes(filterQuery.toLowerCase()) ||
      paper.authors.join(' ').toLowerCase().includes(filterQuery.toLowerCase()) ||
      paper.abstract.toLowerCase().includes(filterQuery.toLowerCase())
    ) : [];

  const savedPapersDiv = (): ReactNode => {
    if (!savedPapers) {
      return <div className="loading">Loading saved papers...</div>;
    }
    else {
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
    }
  }

  return (
    <section className="saved-section">
      <h2>Saved Papers</h2>

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

      <div className="saved-container">
        {savedPapersDiv()}
      </div>
    </section>
  );
}

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

export default SavedPapers;
