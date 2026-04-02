import React, { useState } from 'react';

interface LinkProps {
  arxiv: string | null;
  ss: string | null;
}

export const ExtLinks: React.FC<LinkProps> = ({ arxiv, ss }) => (
  <div className="ext-links">
    {arxiv && (
      <a
        className="ext-link arxiv"
        href={arxiv}
        target="_blank"
        rel="noreferrer"
      >
        ↗ arXiv
      </a>
    )}
    {ss && (
      <a
        className="ext-link ss"
        href={ss}
        target="_blank"
        rel="noreferrer"
      >
        ↗ Semantic Scholar
      </a>
    )}
  </div>
);

export const DoiRow: React.FC<{ doi: string }> = ({ doi }) =>
    <div className="doi-row">
      <span className="doi-lbl">DOI</span>
      {doi ?? "N/A"}
    </div>

export const HighlightedText = ({ text, query }: { text: string, query: string }) => {
  const regex = new RegExp(`(${query})`, "gi");
  const parts = text.split(regex);

  const highlightedText = (!query) ? text : (
    parts.map((part, index) =>
      regex.test(part) ? (
        <span key={index} className="highlighted-text">
          {part}
        </span>
      ) : (
        part
      )
    ));
  return <>{highlightedText} </>
};

export const Abstract: React.FC<{ 
  text: string,
  filterQuery: string
}> = ({ text, filterQuery }) => {
  const COLLAPSED_ABSTRACT_CHARACTER_LIMIT = 300;
  const isAbsCollapsible = text.length > COLLAPSED_ABSTRACT_CHARACTER_LIMIT;

  const [isAbsExpanded, setIsAbsExpanded] = useState<boolean>(false);

  const trimmedText = (text: string, limit: number): string => {
    if (text.length <= limit) return text;

    const trimmed = text.slice(0, limit);
    const lastSpaceIndex = trimmed.lastIndexOf(" ");

    const finalText =
      lastSpaceIndex === -1
        ? trimmed
        : trimmed.slice(0, lastSpaceIndex);

    return finalText + "...";
  }

  const abstractText = (): string => (!isAbsCollapsible || isAbsExpanded) ? text
    : trimmedText(text, COLLAPSED_ABSTRACT_CHARACTER_LIMIT);

  const toggleExpand = () => setIsAbsExpanded(prev => !prev);

  return <div className="abstract">
        <HighlightedText text={abstractText()} query={filterQuery} />
        {(isAbsCollapsible) &&
          <span onClick={toggleExpand} className="abstract-expand">
            {(isAbsExpanded) ? "△ Less" : "▽ More"}
          </span>
        }
      </div>
}