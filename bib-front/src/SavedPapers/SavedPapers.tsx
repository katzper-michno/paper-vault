import React, { useState, useEffect, FormEvent, ChangeEvent, ReactNode } from 'react';
import './SavedPapers.css';
import axios from 'axios';
import BibTeXModal from './../BibTeXModal/BibTeXModal';
import { Paper } from './../types';
import { toast } from 'react-toastify';
import PaperInfo from '../PaperInfo/PaperInfo';

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
    <div className="saved-section">
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
    </div>
  );
}

interface SavedPaperCardProps {
  paper: Paper;
  filterQuery: string;
  onDelete: () => void;
  isDeleting: boolean;
}

const SavedPaperCard: React.FC<SavedPaperCardProps> = ({ paper, filterQuery, onDelete, isDeleting }) => {
  return (
    <article className="saved-paper-card">
      <PaperInfo
        paper={paper}
        filterQuery={filterQuery}
      />
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
