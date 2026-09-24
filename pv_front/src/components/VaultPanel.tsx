import { Paper } from '../types';
import { PaperCard } from './PaperCard';

interface VaultPanelProps {
  savedPapers?: undefined | Paper[];
  searchQuery: string;
  onSearchChange: (q: string) => void;
  filterQuery: string;
  webPanelOpen: boolean;
  webLoading: boolean;
  onWebToggle: () => void;
  onEdit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onUpdateNote: (id: string, note: string | undefined) => Promise<void>;
  onAddFile: (paperId: string, file: File) => Promise<void>;
  onRemoveFile: (paperId: string, name: string) => Promise<void>;
  onOpenFilesDirectory: (paperId: string) => Promise<void>;
  onOpenFile: (paperId: string, name: string) => Promise<void>;
}

export const VaultPanel: React.FC<VaultPanelProps> = ({
  savedPapers,
  searchQuery,
  onSearchChange,
  filterQuery,
  webPanelOpen,
  webLoading,
  onWebToggle,
  onEdit,
  onDelete,
  onUpdateNote,
  onAddFile,
  onRemoveFile,
  onOpenFile,
  onOpenFilesDirectory,
}) => {
  const filteredSavedPapers: Paper[] = savedPapers
    ? savedPapers.filter(
        (paper) =>
          paper.title.toLowerCase().includes(filterQuery) ||
          paper.authors.join(', ').toLowerCase().includes(filterQuery) ||
          paper.abstract.toLowerCase().includes(filterQuery) ||
          (paper.note?.toLowerCase().includes(filterQuery) ?? false)
      )
    : [];

  return (
    <div className="db-panel">
      <div className="db-search-wrap">
        <div className="db-search-input-wrap">
          <span className="search-icon">⌕</span>
          <input
            type="text"
            placeholder="Search your vault…"
            value={searchQuery}
            onChange={(e) => onSearchChange(e.target.value)}
          />
        </div>
        <button
          disabled={webLoading}
          className={`web-toggle-btn${webPanelOpen ? ' active' : ''}`}
          onClick={onWebToggle}
        >
          <span className="dot" />
          <span>Web search</span>
          <span
            className="toggle-arrow"
            style={{ transform: webPanelOpen ? 'rotate(180deg)' : '' }}
          >
            ›
          </span>
        </button>
      </div>
      <div className="db-list">
        {filteredSavedPapers.reverse().map((p) => (
          <PaperCard
            key={p.id}
            paper={p}
            filterQuery={filterQuery}
            onEdit={onEdit}
            onDelete={onDelete}
            onUpdateNote={onUpdateNote}
            onAddFile={onAddFile}
            onRemoveFile={onRemoveFile}
            onOpenFile={onOpenFile}
            onOpenFilesDirectory={onOpenFilesDirectory}
          />
        ))}
        {filteredSavedPapers.length === 0 && (
          <div className="empty-state">No papers match your search.</div>
        )}
      </div>
    </div>
  );
};
