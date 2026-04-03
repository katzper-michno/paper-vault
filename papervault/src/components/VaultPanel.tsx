import { Paper } from "../types";
import { PaperCard } from "./PaperCard";

interface VaultPanelProps {
  savedPapers?: undefined | Paper[];
  filterQuery: string;
  onEdit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
}

export const VaultPanel: React.FC<VaultPanelProps> = ({ savedPapers, filterQuery, onEdit, onDelete }) => {
  const filteredSavedPapers: Paper[] = (savedPapers) ?
    savedPapers.filter(paper =>
      paper.title.toLowerCase().includes(filterQuery) ||
      paper.authors.join(', ').toLowerCase().includes(filterQuery) ||
      paper.abstract.toLowerCase().includes(filterQuery)
    ) : [];

  return (
    <div className="db-panel">
      <div className="db-list">
        {filteredSavedPapers.map(p => (
          <PaperCard
            key={p.id}
            paper={p}
            filterQuery={filterQuery}
            onEdit={onEdit}
            onDelete={onDelete}
          />
        ))}
        {filteredSavedPapers.length === 0 && (
          <div className="empty-state">No papers match your search.</div>
        )}
      </div>
    </div>
  )
}
