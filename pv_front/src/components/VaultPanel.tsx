import { Paper } from '../types';
import { PaperCard } from './PaperCard';

interface VaultPanelProps {
  savedPapers?: undefined | Paper[];
  filterQuery: string;
  onEdit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddFile: (paperId: string, file: File) => Promise<void>;
  onRemoveFile: (paperId: string, name: string) => Promise<void>;
  onOpenFilesDirectory: (paperId: string) => Promise<void>;
  onOpenFile: (paperId: string, name: string) => Promise<void>;
}

export const VaultPanel: React.FC<VaultPanelProps> = ({
  savedPapers,
  filterQuery,
  onEdit,
  onDelete,
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
          paper.abstract.toLowerCase().includes(filterQuery)
      )
    : [];

  return (
    <div className="db-panel">
      <div className="db-list">
        {filteredSavedPapers.map((p) => (
          <PaperCard
            key={p.id}
            paper={p}
            filterQuery={filterQuery}
            onEdit={onEdit}
            onDelete={onDelete}
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
