import React, { useState } from 'react';
import { WebPaper } from '../types';
import { ExtLinks, DoiRow, Abstract } from './PaperMeta';
import { generateBibTeX } from '../utils/bibtex';
import { copyToClipboard } from '../utils/copy-to-clipboard';

interface WebResultCardProps {
  paper: WebPaper;
  isSaved: boolean;
  onSave: (paper: WebPaper) => Promise<void>;
}

export const WebResultCard: React.FC<WebResultCardProps> = ({ paper, isSaved, onSave }) => {
  const [isBeingSaved, setIsBeingSaved] = useState<boolean>(false);
  const saveLock = isSaved || isBeingSaved;

  const [copiedBibtex, setCopiedBibtex] = useState<boolean>(false);
  const [bibtexModal, setBibtexModal] = useState<{ open: boolean; content: string }>({
    open: false,
    content: '',
  });
  const [copiedBibtexModal, setCopiedBibtexModal] = useState<boolean>(false);

  const handleSave = async () => {
    setIsBeingSaved(true);
    await onSave(paper);
    setIsBeingSaved(false);
  };

  const handleShowBibtex = () => {
    setBibtexModal({ open: true, content: generateBibTeX(paper) });
  };

  const handleCopyBibtex = () => {
    copyToClipboard(Promise.resolve(generateBibTeX(paper)));
    setCopiedBibtex(true);
    setTimeout(() => setCopiedBibtex(false), 1500);
  };

  const handleModalCopy = () => {
    copyToClipboard(Promise.resolve(bibtexModal.content));
    setCopiedBibtexModal(true);
    setTimeout(() => setCopiedBibtexModal(false), 1500);
  };

  const handleModalClose = () => setBibtexModal((prev) => ({ ...prev, open: false }));

  return (
    <div className="web-card">
      <div className="card-top">
        <div className="card-main">
          <div className="paper-title">{paper.title}</div>
          <div className="web-authors">{paper.authors.join(', ')}</div>
        </div>
        <div className="card-actions">
          <button onClick={handleShowBibtex} className="act-btn bibtex">
            Show BibTeX
          </button>
          <button disabled={copiedBibtex} onClick={handleCopyBibtex} className="act-btn bibtex">
            {copiedBibtex ? '✓ Copied' : 'Copy BibTeX'}
          </button>
        </div>
      </div>

      <div className="paper-meta">
        <span className="tag venue">{paper.venue || "N/A"}</span>
        <span className="tag">{paper.year}</span>
      </div>

      <DoiRow doi={paper.doi} />
      <ExtLinks urls={paper.urls} />
      <Abstract text={paper.abstract} filterQuery="" />

      <button
        disabled={saveLock}
        className={`save-btn${saveLock ? ' saved' : ''}`}
        onClick={handleSave}
      >
        {isSaved ? '✓ Saved' : isBeingSaved ? 'Saving...' : '+ Save to vault'}
      </button>

      <div
        className={`overlay${bibtexModal.open ? ' open' : ''}`}
        onClick={(e) => e.target === e.currentTarget && handleModalClose()}
      >
        <div className="modal bibtex-modal">
          <div className="modal-title">BibTeX citation</div>
          <textarea className="bibtex-textarea" readOnly value={bibtexModal.content} />
          <div className="mactions">
            <button className="btn-cancel" type="button" onClick={handleModalClose}>
              Close
            </button>
            <button
              disabled={copiedBibtexModal}
              className="btn-save"
              type="button"
              onClick={handleModalCopy}
            >
              {copiedBibtexModal ? '✓ Copied' : 'Copy'}
            </button>
          </div>
        </div>
      </div>
    </div>
  );
};
