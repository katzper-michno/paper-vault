import React, { useState } from 'react';
import { WebPaper } from '../types';
import { ExtLinks, DoiRow, Abstract } from './PaperMeta';

interface WebResultCardProps {
  paper: WebPaper;
  isSaved: boolean;
  onSave: (paper: WebPaper) => Promise<void>;
}

export const WebResultCard: React.FC<WebResultCardProps> = ({ paper, isSaved, onSave }) => {
  const [isBeingSaved, setIsBeingSaved] = useState<boolean>(false);

  const saveLock = isSaved || isBeingSaved;

  const handleSave = async () => {
    setIsBeingSaved(true);
    await onSave(paper);
    setIsBeingSaved(false);
  };

  return (
    <div className="web-card">
      <div className="paper-title">{paper.title}</div>
      <div className="web-authors">{paper.authors.join(', ')}</div>

      <div className="paper-meta">
        <span className="tag venue">{paper.venue}</span>
        <span className="tag">{paper.year}</span>
      </div>

      <DoiRow doi={paper.doi} />
      <ExtLinks urls={paper.urls} />
      <Abstract text={paper.abstract} filterQuery='' />

      <button
        disabled={saveLock}
        className={`save-btn${saveLock ? ' saved' : ''}`}
        onClick={handleSave}
      >
        {isSaved ? '✓ Saved' :
          (isBeingSaved ? 'Saving...' : '+ Save to library')
        }
      </button>
    </div>
  );
}
