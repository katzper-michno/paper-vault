import React from 'react';
import { WebPaper } from '../types';
import { ExtLinks, DoiRow, Abstract } from './PaperMeta';

interface WebResultCardProps {
  paper: WebPaper;
  isAddingDisabled: boolean;
  saved: boolean;
  onSave: (paper: WebPaper) => void;
}

export const WebResultCard: React.FC<WebResultCardProps> = ({ paper, isAddingDisabled, saved, onSave }) => (
  <div className="web-card">
    <div className="paper-title">{paper.title}</div>
    <div className="web-authors">{paper.authors.join(', ')}</div>

    <div className="paper-meta">
      <span className="tag venue">{paper.venue}</span>
      <span className="tag">{paper.year}</span>
    </div>

    <DoiRow doi={paper.doi} />
    <ExtLinks arxiv={paper.urls.arxiv} ss={paper.urls.semanticScholar} />

    <Abstract text={paper.abstract} filterQuery='' />

    <button
      disabled={isAddingDisabled || saved}
      className={`save-btn${saved || isAddingDisabled ? ' saved' : ''}`}
      onClick={() => !saved && onSave(paper)}
    >
      {saved ? '✓ Saved' : 
        (isAddingDisabled ? 'Saving...' : '+ Save to library')
      }
    </button>
  </div>
);