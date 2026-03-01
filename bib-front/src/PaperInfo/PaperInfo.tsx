import { useState } from "react";
import { Paper } from "../types";
import './PaperInfo.css';
import { ReactComponent as ArxivLogo } from './arxiv-logo.svg'
import { ReactComponent as SemanticScholarLogo } from './semantic-scholar-logo.svg'

const HighlightedText = ({ text, query, expanded = false }: { text: string, query: string, expanded?: Boolean }) => {
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

interface PaperInfoProps {
  paper: Paper;
  filterQuery: string;
}

const PaperInfo = ({ paper, filterQuery }: PaperInfoProps) => {
  const COLLAPSED_ABSTRACT_CHARACTER_LIMIT = 300;
  const isCollapsible = paper.abstract.length > COLLAPSED_ABSTRACT_CHARACTER_LIMIT;

  const [isAbsExpanded, setIsAbsExpanded] = useState<Boolean>(false);

  const abstractText = (): string => (!isCollapsible || isAbsExpanded) ? paper.abstract
    : trimmedText(paper.abstract, COLLAPSED_ABSTRACT_CHARACTER_LIMIT);

  const toggleExpand = () => setIsAbsExpanded(prev => !prev);

  return (
    <div className="paper-content">
      <h4 className="paper-title">
        <HighlightedText text={paper.title} query={filterQuery} />
      </h4>
      <p className="paper-authors-year-venue">
        {
          paper.authors.map((author: string) => (
            <div className="item-box">
              <HighlightedText text={author} query={filterQuery} />
            </div>
          ))
        }
        <span>&middot;</span>
        <span>{paper.year}</span>
        <span>&middot;</span>
        <span>{paper.venue}</span>
      </p>

      <p className="paper-abstract">
        <HighlightedText
          text={abstractText()}
          query={filterQuery}
          expanded={isAbsExpanded}
        />
        {(isCollapsible) &&
          <span onClick={toggleExpand} className="abstract-expand">
            {(isAbsExpanded) ? "△ Less" : "▽ More"}
          </span>
        }
      </p>

      <div className="paper-urls-container">
        {(paper.urls.arxiv) &&
          <a href={paper.urls.arxiv} target="_blank" className="arxiv-button">
            <ArxivLogo style={{ width: "50px", height: "20px", fill: "#fff" }} />
          </a>
        }
        {(paper.urls.semanticScholar) &&
          <a href={paper.urls.semanticScholar} target="_blank" className="semantic-scholar-button">
            <SemanticScholarLogo style={{ width: "120px", height: "20px", fill: "#fff" }} />
          </a>
        }
      </div>
    </div>
  );
}

export default PaperInfo;
