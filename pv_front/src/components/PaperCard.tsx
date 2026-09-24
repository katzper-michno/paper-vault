import React, { useState } from 'react';
import { Paper } from '../types';
import { ExtLinks, DoiRow, Abstract, HighlightedText } from './PaperMeta';
import axios from 'axios';
import { toast } from 'react-toastify';
import { FilesRow } from './FilesRow';
import { copyToClipboard } from '../utils/copy-to-clipboard';

interface PaperCardProps {
  paper: Paper;
  filterQuery: string;
  onEdit: (id: string) => Promise<void>;
  onDelete: (id: string) => Promise<void>;
  onAddFile: (paperId: string, file: File) => Promise<void>;
  onRemoveFile: (paperId: string, name: string) => Promise<void>;
  onOpenFilesDirectory: (paperId: string) => Promise<void>;
  onOpenFile: (paperId: string, name: string) => Promise<void>;
}

export const PaperCard: React.FC<PaperCardProps> = ({
  paper,
  filterQuery,
  onEdit,
  onDelete,
  onAddFile,
  onRemoveFile,
  onOpenFile,
  onOpenFilesDirectory,
}) => {
  const SERVER_HOST = import.meta.env.VITE_BACKEND_BASE_URL;

  const [isEdited, setIsEdited] = useState<boolean>(false);
  const [isDeleted, setIsDeleted] = useState<boolean>(false);
  const modifyLock = isEdited || isDeleted;

  const [copiedBibtex, setCopiedBibtex] = useState<boolean>(false);

  const [fetchingBibtexShow, setFetchingBibtexShow] = useState<boolean>(false);
  const [bibtexModal, setBibtexModal] = useState<{ open: boolean; content: string }>({
    open: false,
    content: '',
  });
  const [copiedBibtexModal, setCopiedBibtexModal] = useState<boolean>(false);

  const handleEdit = async () => {
    setIsEdited(true);
    await onEdit(paper.id);
    setIsEdited(false);
  };

  const handleDelete = async () => {
    setIsDeleted(true);
    await onDelete(paper.id);
    setIsDeleted(false);
  };

  const handleCopyBibtex = () => {
    try {
      const s = axios
        .get<{ bibtex: string }>(`${SERVER_HOST}/papers/${paper.id}/bibtex`)
        .then((res) => res.data.bibtex);
      copyToClipboard(s);
      setCopiedBibtex(true);
      setTimeout(() => setCopiedBibtex(false), 1500);
    } catch (err: any) {
      console.error('Error fetching BibTeX:', err);
      toast.error(`Error fetching BibTeX: ${err.response?.data.message || err}`);
    }
  };

  const handleShowBibtex = async () => {
    setFetchingBibtexShow(true);
    try {
      const res = await axios.get<{ bibtex: string }>(`${SERVER_HOST}/papers/${paper.id}/bibtex`);
      setBibtexModal({ open: true, content: res.data.bibtex });
    } catch (err: any) {
      console.error('Error fetching BibTeX:', err);
      toast.error(`Error fetching BibTeX: ${err.response?.data.message || err}`);
    } finally {
      setFetchingBibtexShow(false);
    }
  };

  const handleModalCopy = () => {
    copyToClipboard(Promise.resolve(bibtexModal.content));
    setCopiedBibtexModal(true);
    setTimeout(() => setCopiedBibtexModal(false), 1500);
  };

  const handleModalClose = () => setBibtexModal((prev) => ({ ...prev, open: false }));

  return (
    <div className="paper-card">
      <div className="card-top">
        <div className="card-main">
          <div className="paper-title">
            <HighlightedText text={paper.title} query={filterQuery} />
          </div>
          <div className="paper-authors">
            <HighlightedText text={paper.authors.join(', ')} query={filterQuery} />
          </div>
        </div>
        <div className="card-actions">
          <button
            disabled={fetchingBibtexShow}
            onClick={handleShowBibtex}
            className="act-btn bibtex"
          >
            {fetchingBibtexShow ? 'Loading...' : 'Show BibTeX'}
          </button>
          <button disabled={copiedBibtex} onClick={handleCopyBibtex} className="act-btn bibtex">
            {copiedBibtex ? '✓ Copied' : 'Copy BibTeX'}
          </button>
          <button className="act-btn" onClick={handleEdit}>
            {isEdited ? 'Editing...' : 'Edit'}
          </button>
          <button disabled={modifyLock} className="act-btn del" onClick={handleDelete}>
            {isDeleted ? 'Removing...' : 'Remove'}
          </button>
        </div>
      </div>

      <div className="paper-meta">
        <span className="tag venue">{paper.venue}</span>
        <span className="tag">{paper.year}</span>
      </div>

      <DoiRow doi={paper.doi} />
      <ExtLinks urls={paper.urls} />
      <Abstract text={paper.abstract} filterQuery={filterQuery} />

      <FilesRow
        paper={paper}
        onAddFile={(file: File) => onAddFile(paper.id, file)}
        onRemoveFile={(name: string) => onRemoveFile(paper.id, name)}
        onOpenFilesDirectory={() => onOpenFilesDirectory(paper.id)}
        onOpenFile={(name: string) => onOpenFile(paper.id, name)}
      />

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
