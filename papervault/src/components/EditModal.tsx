import React, { useEffect } from 'react';
import { Paper, EditFormValues } from '../types';

interface EditModalProps {
  paper: Paper | null;
  onClose: () => void;
  onSave: (id: string, values: EditFormValues) => void;
}

export const EditModal: React.FC<EditModalProps> = ({ paper, onClose, onSave }) => {
  const [form, setForm] = React.useState<EditFormValues>({
    title: '', authors: [], venue: '', year: 0, doi: '', urls: { arxiv: '', semanticScholar: ''} , abstract: '',
  });

  useEffect(() => {
    if (paper) {
      setForm({
        title: paper.title,
        authors: paper.authors,
        venue: paper.venue,
        year: paper.year,
        doi: paper.doi,
        urls: paper.urls,
        abstract: paper.abstract,
      });
    }
  }, [paper]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const handleSave = () => {
    if (paper) onSave(paper.id, form);
  };

  const set = (field: keyof EditFormValues) =>
    (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>) =>
      setForm(prev => ({ ...prev, [field]: e.target.value }));

  return (
    <div className={`overlay${paper ? ' open' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-title">Edit paper</div>

        <div className="mfield">
          <div className="mlabel">Title</div>
          <input value={form.title} onChange={set('title')} />
        </div>
        <div className="mfield">
          <div className="mlabel">Authors</div>
          <input value={form.authors} onChange={set('authors')} />
        </div>
        <div className="mrow">
          <div className="mfield">
            <div className="mlabel">Venue</div>
            <input value={form.venue} onChange={set('venue')} />
          </div>
          <div className="mfield">
            <div className="mlabel">Year</div>
            <input value={form.year} onChange={set('year')} />
          </div>
        </div>
        <div className="mfield">
          <div className="mlabel">DOI</div>
          <input value={form.doi} onChange={set('doi')} placeholder="10.xxxx/xxxxx" />
        </div>
        <div className="mrow">
          <div className="mfield">
            <div className="mlabel">arXiv ID</div>
            <input value={form.urls.arxiv} onChange={set('urls.arxiv')} placeholder="1706.03762" />
          </div>
          <div className="mfield">
            <div className="mlabel">Semantic Scholar ID</div>
            <input value={form.urls.semanticScholar} onChange={set('urls.semanticScholar')} />
          </div>
        </div>
        <div className="mfield">
          <div className="mlabel">Abstract</div>
          <textarea value={form.abstract} onChange={set('abstract')} />
        </div>

        <div className="mactions">
          <button className="btn-cancel" onClick={onClose}>Cancel</button>
          <button className="btn-save" onClick={handleSave}>Save changes</button>
        </div>
      </div>
    </div>
  );
};