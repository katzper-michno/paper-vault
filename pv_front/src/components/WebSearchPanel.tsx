import React, { useRef } from 'react';
import { WebPaper } from '../types';
import { WebResultCard } from './WebResultCard';

interface WebSearchPanelProps {
  results: WebPaper[];
  savedIds: Set<string>;
  onSave: (paper: WebPaper) => Promise<void>;
  searching: boolean;
  loadingMore: boolean;
  hasMore: boolean;
  onLoadMore: () => void;
}

const LOAD_MORE_THRESHOLD_PX = 150;

export const WebSearchPanel: React.FC<WebSearchPanelProps> = ({
  results,
  savedIds,
  onSave,
  searching,
  loadingMore,
  hasMore,
  onLoadMore,
}) => {
  const requestedLoadMore = useRef(false);

  const handleScroll = (e: React.UIEvent<HTMLDivElement>) => {
    if (searching || loadingMore || !hasMore || requestedLoadMore.current) return;

    const el = e.currentTarget;
    const nearBottom = el.scrollHeight - el.scrollTop - el.clientHeight < LOAD_MORE_THRESHOLD_PX;

    if (nearBottom) {
      requestedLoadMore.current = true;
      onLoadMore();
    }
  };

  if (!loadingMore) {
    requestedLoadMore.current = false;
  }

  return (
    <div className="web-results" onScroll={handleScroll}>
      {searching ? (
        <div className="web-loading-state">
          <span className="spinner" />
          <span>Searching…</span>
        </div>
      ) : results.length > 0 ? (
        <>
          {results.map((p) => (
            <WebResultCard key={p.id} paper={p} isSaved={savedIds.has(p.id)} onSave={onSave} />
          ))}
          {loadingMore && (
            <div className="web-loading-more">
              <span className="spinner spinner-sm" />
            </div>
          )}
        </>
      ) : (
        <div className="empty-state">No papers match your search.</div>
      )}
    </div>
  );
};
