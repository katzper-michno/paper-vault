import React, { useState } from 'react';
import { Paper } from '../types';
import { ExtLinks, DoiRow, Abstract, HighlightedText } from './PaperMeta';

interface PaperCardProps {
  paper: Paper;
  isRemoveDisabled: boolean;
  filterQuery: string;
  onEdit: (paper: Paper) => void;
  onRemove: (id: string) => void;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, isRemoveDisabled, filterQuery, onEdit, onRemove }) => {
  const [filesOpen, setFilesOpen] = useState<boolean>(false);

  const fileCount = paper.files.length;

  return (
    <div className="paper-card">
      <div className="card-top">
        <div className="card-main">
          <div className="paper-title">
            <HighlightedText text={paper.title} query={filterQuery} />
          </div>
          <div className="paper-authors">
            <HighlightedText text={paper.authors.join(', ')} query={filterQuery} />
          </div>
        </div>
        <div className="card-actions">
          <button className="act-btn" onClick={() => onEdit(paper)}>Edit</button>
          <button 
            disabled={isRemoveDisabled}
            className="act-btn del" 
            onClick={() => onRemove(paper.id)}
          >
            {(isRemoveDisabled) ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>

      <div className="paper-meta">
        <span className="tag venue">{paper.venue}</span>
        <span className="tag">{paper.year}</span>
      </div>

      <DoiRow doi={paper.doi} />
      <ExtLinks arxiv={paper.urls.arxiv} ss={paper.urls.semanticScholar} />

      <Abstract text={paper.abstract} filterQuery={filterQuery} />

      <div className="files-section">
        <div className="files-row">
          <button className="files-toggle" onClick={() => setFilesOpen(o => !o)}>
            <span className={`arrow${filesOpen ? ' open' : ''}`}>›</span>
            {fileCount > 0
              ? `${fileCount} attached file${fileCount > 1 ? 's' : ''}`
              : 'No files'}
          </button>
          <button 
            onClick={() => window.alert('Attaching files is not yet implemented...')}
            className="attach-btn"
          >
            + Attach
          </button>
        </div>

        {filesOpen && fileCount > 0 && (
          <div className="files-list">
            {paper.files.map((f, i) => (
              <div className="file-item" key={i}>
                <span className="file-icon">⎙</span>
                <span className="file-name">{f.name}</span>
                <button className="file-open">Open</button>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};