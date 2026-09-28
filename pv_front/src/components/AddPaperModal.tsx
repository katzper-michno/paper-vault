import React, { FormEvent, useState } from 'react';

interface AddPaperModalProps {
  open: boolean;
  onClose: () => void;
  onManual: () => void;
  onFetchByDoi: (doi: string) => Promise<boolean>;
}

export const AddPaperModal: React.FC<AddPaperModalProps> = ({
  open,
  onClose,
  onManual,
  onFetchByDoi,
}) => {
  const [doi, setDoi] = useState('');
  const [fetching, setFetching] = useState(false);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleManual = () => {
    setDoi('');
    onManual();
    onClose();
  };

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    if (!doi.trim() || fetching) return;

    setFetching(true);
    const success = await onFetchByDoi(doi.trim());
    setFetching(false);

    if (success) {
      setDoi('');
      onClose();
    }
  };

  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={handleOverlayClick}>
      <div className="modal add-paper-modal">
        <div className="modal-title">Add paper</div>

        <form onSubmit={handleSubmit}>
          <div className="mfield">
            <div className="mlabel">DOI, arXiv ID, or arXiv URL</div>
            <input
              autoFocus
              placeholder="10.1038/nature12373"
              value={doi}
              onChange={(e) => setDoi(e.target.value)}
            />
          </div>

          <div className="mactions">
            <button className="btn-cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button disabled={fetching || !doi.trim()} className="btn-save" type="submit">
              {fetching ? 'Fetching…' : 'Fetch & add'}
            </button>
          </div>
        </form>

        <div className="add-paper-divider">or</div>

        <button type="button" className="add-paper-manual-btn" onClick={handleManual}>
          + Enter details manually
        </button>
      </div>
    </div>
  );
};
