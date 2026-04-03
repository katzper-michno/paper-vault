import React, { useState } from 'react';
import { Paper } from '../types';
import { ExtLinks, DoiRow, Abstract, HighlightedText } from './PaperMeta';

interface PaperCardProps {
  paper: Paper;
  filterQuery: string;
  onEdit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const PaperCard: React.FC<PaperCardProps> = ({ paper, filterQuery, onEdit, onDelete }) => {
  const [filesOpen, setFilesOpen] = useState<boolean>(false);
  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);

  const modifyLock = isEdited || isDeleted;

  const fileCount = paper.files.length;

  const handleEdit = async () => {
    setIsEdited(true);
    await onEdit(paper.id);
    setIsEdited(false);
  };

  const handleDelete = async () => {
    setIsDeleted(true);
    await onDelete(paper.id);
    setIsDeleted(false);
  };

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
          <button
            className="act-btn"
            onClick={handleEdit}
          >
            {(isEdited) ? 'Editing...' : 'Edit'}
          </button>
          <button
            disabled={modifyLock}
            className="act-btn del"
            onClick={handleDelete}
          >
            {(isDeleted) ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>

      <div className="paper-meta">
        <span className="tag venue">{paper.venue}</span>
        <span className="tag">{paper.year}</span>
      </div>

      <DoiRow doi={paper.doi} />
      <ExtLinks arxiv={paper.urls.arxiv} semanticScholar={paper.urls.semanticScholar} />

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
