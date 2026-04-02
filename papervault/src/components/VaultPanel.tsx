import axios from "axios";
import { Paper } from "../types";
import { toast } from "react-toastify";
import { useState } from "react";
import { PaperCard } from "./PaperCard";

interface LoadingState {
  delete: string | null;
}

interface VaultPanelProps {
  savedPapers?: undefined | Paper[];
  filterQuery: string;
  onDeletedPaperSuccess: (deletedId: string) => void;
}

export const VaultPanel: React.FC<VaultPanelProps> = ({ savedPapers, filterQuery, onDeletedPaperSuccess }) => {
  const SERVER_HOST = import.meta.env.VITE_BACKEND_BASE_URL;

  const [loading, setLoading] = useState<LoadingState>({
    delete: null,
  });

  const handleDeletePaper = async (paperId: string): Promise<void> => {
    setLoading(prev => ({ ...prev, delete: paperId }));

    try {
      await axios.delete(`${SERVER_HOST}/papers/${paperId}`);
      onDeletedPaperSuccess(paperId);
    } catch (err: any) {
      console.error('Error deleting paper:', err);
      toast.error(`Error deleting paper ${err.response.data.message}`)
    } finally {
      setLoading({ delete: null });
    }
  };

  const handleEditPaper = () => {
    window.alert("Editing is not yet implemented...")
  }

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
            isRemoveDisabled={loading.delete === p.id}
            filterQuery={filterQuery}
            onEdit={handleEditPaper}
            onRemove={handleDeletePaper}
          />
        ))}
        {filteredSavedPapers.length === 0 && (
          <div className="empty-state">No papers match your search.</div>
        )}
      </div>
    </div>
  )
}