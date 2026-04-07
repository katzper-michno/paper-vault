import React, { FormEvent, useEffect, useState } from 'react';
import { Paper, EditFormValues } from '../types';

const CURRENT_YEAR = new Date().getFullYear();

interface EditModalProps {
  paper: Paper | null;
  onClose: () => void;
  onSave: (id: string, values: EditFormValues) => Promise<void>;
}

type Draft = Omit<EditFormValues, "year"> & { year: string };

const EMPTY_DRAFT: Draft = {
  title: '',
  authors: [""],
  venue: '',
  year: String(CURRENT_YEAR),
  doi: '',
  urls: {
    openAlex: '',
    arxiv: '',
    sciHub: ''
  },
  abstract: '',
}

export const EditModal: React.FC<EditModalProps> = ({ paper, onClose, onSave }) => {
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (paper) {
      setDraft({
        title: paper.title,
        authors: paper.authors,
        venue: paper.venue,
        year: String(paper.year),
        doi: paper.doi,
        urls: paper.urls,
        abstract: paper.abstract,
      });
    }
  }, [paper]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) =>
    setDraft((prev: Draft) => ({ ...prev, [field]: value }));

  const setUrl = (key: keyof Draft["urls"], value: string) =>
    setDraft((prev: Draft) => ({ ...prev, urls: { ...prev.urls, [key]: value } }));

  const setAuthor = (index: number, value: string) => {
    const next = [...draft.authors];
    next[index] = value;
    set("authors", next);
  };

  const addAuthor = () => set("authors", [...draft.authors, ""]);

  const removeAuthor = (index: number) =>
    set("authors", draft.authors.filter((_, i) => i !== index));

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const clean: EditFormValues = {
      ...draft,
      authors: draft.authors.filter((a) => a.trim() !== ""),
      year: Number(draft.year),
      urls: {
        openAlex: draft.urls.openAlex || undefined,
        arxiv: draft.urls.arxiv || undefined,
        sciHub: draft.urls.sciHub || undefined
      },
    };

    if (paper) {
      setSubmitted(true);
      await onSave(paper.id, clean);
      setSubmitted(false);
    }
  };

  return (
    <div className={`overlay${paper ? ' open' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-title">Edit paper</div>

        <form onSubmit={handleSubmit}>
          <div className="mfield">
            <div className="mlabel">Title</div>
            <input
              placeholder='Paper title'
              value={draft.title}
              onChange={(e) => set('title', e.target.value)}
            />
          </div>

          <div className="mlabel">Authors</div>

          {
            draft.authors.map((author: string, i: number) => (
              <div key={i} className="mrow">
                <div className="mfield">
                  <input
                    placeholder={`Author ${i + 1}`}
                    value={author}
                    onChange={(e) => setAuthor(i, e.target.value)}
                  />
                </div>
                <button
                  disabled={draft.authors.length <= 1}
                  type="button"
                  className="mbtn-del-author"
                  onClick={() => removeAuthor(i)}
                >
                  ×
                </button>
              </div>
            ))
          }

          <button
            type="button"
            className="mbtn-add-author"
            onClick={addAuthor}
          >
            + Add author
          </button>

          <div className="mrow">
            <div className="mfield">
              <div className="mlabel">Venue</div>
              <input
                placeholder='Venue'
                value={draft.venue}
                onChange={(e) => set('venue', e.target.value)} />
            </div>

            <div className="mfield">
              <div className="mlabel">Year</div>
              <input
                placeholder='Year of publication'
                value={draft.year}
                onChange={(e) => set('year', e.target.value)}
              />
            </div>
          </div>

          <div className="mfield">
            <div className="mlabel">DOI</div>
            <input
              value={draft.doi}
              onChange={(e) => set('doi', e.target.value)}
              placeholder="10.xxxx/xxxxx"
            />
          </div>

          <div className="mfield">
            <div className="mlabel">OpenAlex</div>
            <input
              value={draft.urls.openAlex}
              onChange={(e) => setUrl('openAlex', e.target.value)}
              placeholder='openalex.org/works/:oa_id'
            />
          </div>

          <div className="mfield">
            <div className="mlabel">arXiv</div>
            <input
              value={draft.urls.arxiv}
              onChange={(e) => setUrl('arxiv', e.target.value)}
              placeholder="arxiv.org/abs/:arxiv_id"
            />
          </div>

          <div className="mfield">
            <div className="mlabel">Sci-Hub</div>
            <input
              value={draft.urls.sciHub}
              onChange={(e) => setUrl('sciHub', e.target.value)}
              placeholder='sci-hub.pl/:sh_id'
            />
          </div>

          <div className="mfield">
            <div className="mlabel">Abstract</div>
            <textarea
              value={draft.abstract}
              onChange={(e) => set('abstract', e.target.value)}
              placeholder="Paper abstract"
            />
          </div>

          <div className="mactions">
            <button className="btn-cancel" type="button" onClick={onClose}>Cancel</button>
            <button
              disabled={submitted}
              className="btn-save"
              type="submit"
            >
              {submitted ? 'Saving changes...' : 'Save changes'}
            </button>
          </div>

        </form>
      </div>
    </div>
  );
};
