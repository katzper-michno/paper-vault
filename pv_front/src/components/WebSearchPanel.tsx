import { WebPaper } from '../types';
import { WebResultCard } from './WebResultCard';

interface WebSearchPanelProps {
  results: WebPaper[];
  savedIds: Set<string>;
  onSave: (paper: WebPaper) => Promise<void>;
}

export const WebSearchPanel: React.FC<WebSearchPanelProps> = ({ results, savedIds, onSave }) => (
  <div className="web-results">
    {results.length > 0 ? (
      results.map((p) => (
        <WebResultCard key={p.id} paper={p} isSaved={savedIds.has(p.id)} onSave={onSave} />
      ))
    ) : (
      <div className="empty-state">No papers match your search.</div>
    )}
  </div>
);
