import React, { useState } from 'react';
import { PaperUrls } from '../types';

interface LinkProps {
  urls: PaperUrls;
}

export const ExtLinks: React.FC<LinkProps> = ({ urls }) => (
  <div className="ext-links">
    {urls.openAlex && (
      <a className="ext-link oa" href={urls.openAlex} target="_blank" rel="noreferrer">
        ↗ OpenAlex
      </a>
    )}
    {urls.semanticScholar && (
      <a className="ext-link ss" href={urls.semanticScholar} target="_blank" rel="noreferrer">
        ↗ Semantic Scholar
      </a>
    )}
    {urls.arxiv && (
      <a className="ext-link arxiv" href={urls.arxiv} target="_blank" rel="noreferrer">
        ↗ arXiv
      </a>
    )}
    {urls.sciHub && (
      <a className="ext-link sh" href={urls.sciHub} target="_blank" rel="noreferrer">
        ↗ Sci-Hub
      </a>
    )}
  </div>
);

export const DoiRow: React.FC<{ doi: string }> = ({ doi }) => (
  <div className="doi-row">
    <span className="doi-lbl">DOI</span>
    {doi ?? 'N/A'}
  </div>
);

export const HighlightedText = ({ text, query }: { text: string; query: string }) => {
  const regex = new RegExp(`(${query})`, 'gi');
  const parts = text.split(regex);

  const highlightedText = !query
    ? text
    : parts.map((part, index) =>
        regex.test(part) ? (
          <span key={index} className="highlighted-text">
            {part}
          </span>
        ) : (
          part
        )
      );
  return <>{highlightedText} </>;
};

const COLLAPSED_CHAR_LIMIT = 300;

export const trimToLimit = (text: string, limit: number): string => {
  if (text.length <= limit) return text;
  const cut = text.slice(0, limit);
  const lastSpace = cut.lastIndexOf(' ');
  return (lastSpace === -1 ? cut : cut.slice(0, lastSpace)) + '...';
};

export const Abstract: React.FC<{
  text: string;
  filterQuery: string;
}> = ({ text, filterQuery }) => {
  const isCollapsible = text.length > COLLAPSED_CHAR_LIMIT;
  const [userExpanded, setUserExpanded] = useState<boolean>(false);

  // Auto-expand whenever the query matches anywhere in the text.
  // Derived — collapses automatically when query is cleared.
  const matchInText =
    isCollapsible && !!filterQuery && text.toLowerCase().includes(filterQuery.toLowerCase());

  const isExpanded = userExpanded || matchInText;
  const displayText = !isCollapsible || isExpanded ? text : trimToLimit(text, COLLAPSED_CHAR_LIMIT);

  return (
    <div className="abstract">
      <HighlightedText text={displayText} query={filterQuery} />
      {isCollapsible && !matchInText && (
        <span onClick={() => setUserExpanded((p) => !p)} className="abstract-expand">
          {isExpanded ? '△ Less' : '▽ More'}
        </span>
      )}
    </div>
  );
};
