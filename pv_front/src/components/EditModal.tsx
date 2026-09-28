import React, { FormEvent, useEffect, useState } from 'react';
import { Paper, EditFormValues, PublicationType } from '../types';

const CURRENT_YEAR = new Date().getFullYear();

interface EditModalProps {
  open: boolean;
  paper?: Paper | null;
  onClose: () => void;
  onSave: (id: string | null, values: EditFormValues) => Promise<void>;
}

type Draft = {
  title: string;
  authors: string[];
  venue: string;
  year: string;
  doi: string;
  urls: {
    openAlex: string;
    semanticScholar: string;
    arxiv: string;
    sciHub: string;
    openAccessPdf: string;
  };
  volume: string;
  issue: string;
  pages: string;
  publicationType: PublicationType | '';
  abstract: string;
  note: string;
};

const EMPTY_DRAFT: Draft = {
  title: '',
  authors: [''],
  venue: '',
  year: String(CURRENT_YEAR),
  doi: '',
  urls: {
    openAlex: '',
    semanticScholar: '',
    arxiv: '',
    sciHub: '',
    openAccessPdf: '',
  },
  volume: '',
  issue: '',
  pages: '',
  publicationType: '',
  abstract: '',
  note: '',
};

const draftFromPaper = (paper: Paper): Draft => ({
  title: paper.title,
  authors: paper.authors.length > 0 ? paper.authors : [''],
  venue: paper.venue,
  year: String(paper.year),
  doi: paper.doi,
  urls: {
    openAlex: paper.urls.openAlex ?? '',
    semanticScholar: paper.urls.semanticScholar ?? '',
    arxiv: paper.urls.arxiv ?? '',
    sciHub: paper.urls.sciHub ?? '',
    openAccessPdf: paper.urls.openAccessPdf ?? '',
  },
  volume: paper.volume ?? '',
  issue: paper.issue ?? '',
  pages: paper.pages ?? '',
  publicationType: paper.publicationType ?? '',
  abstract: paper.abstract,
  note: paper.note ?? '',
});

export const EditModal: React.FC<EditModalProps> = ({ open, paper, onClose, onSave }) => {
  const isEdit = !!paper;
  const [draft, setDraft] = useState<Draft>(EMPTY_DRAFT);
  const [submitted, setSubmitted] = useState<boolean>(false);

  useEffect(() => {
    if (!open) return;
    setDraft(paper ? draftFromPaper(paper) : EMPTY_DRAFT);
  }, [open, paper]);

  const handleOverlayClick = (e: React.MouseEvent<HTMLDivElement>) => {
    if (e.target === e.currentTarget) onClose();
  };

  const set = <K extends keyof Draft>(field: K, value: Draft[K]) =>
    setDraft((prev: Draft) => ({ ...prev, [field]: value }));

  const setUrl = (key: keyof Draft['urls'], value: string) =>
    setDraft((prev: Draft) => ({ ...prev, urls: { ...prev.urls, [key]: value } }));

  const setAuthor = (index: number, value: string) => {
    const next = [...draft.authors];
    next[index] = value;
    set('authors', next);
  };

  const addAuthor = () => set('authors', [...draft.authors, '']);

  const removeAuthor = (index: number) =>
    set(
      'authors',
      draft.authors.filter((_, i) => i !== index)
    );

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();

    const clean: EditFormValues = {
      title: draft.title,
      authors: draft.authors.filter((a) => a.trim() !== ''),
      venue: draft.venue,
      year: Number(draft.year),
      doi: draft.doi,
      urls: {
        openAlex: draft.urls.openAlex || undefined,
        semanticScholar: draft.urls.semanticScholar || undefined,
        arxiv: draft.urls.arxiv || undefined,
        sciHub: draft.urls.sciHub || undefined,
        openAccessPdf: draft.urls.openAccessPdf || undefined,
      },
      volume: draft.volume || undefined,
      issue: draft.issue || undefined,
      pages: draft.pages || undefined,
      publicationType: draft.publicationType || undefined,
      abstract: draft.abstract,
      note: draft.note.trim() || undefined,
    };

    setSubmitted(true);
    await onSave(paper?.id ?? null, clean);
    setSubmitted(false);
  };

  return (
    <div className={`overlay${open ? ' open' : ''}`} onClick={handleOverlayClick}>
      <div className="modal">
        <div className="modal-title">{isEdit ? 'Edit paper' : 'Add paper'}</div>

        <form className="modal-form" onSubmit={handleSubmit}>
          <div className="modal-body">
            <div className="mfield">
              <div className="mlabel">Title</div>
              <input
                placeholder="Paper title"
                value={draft.title}
                onChange={(e) => set('title', e.target.value)}
              />
            </div>

            <div className="mlabel">Authors</div>

            <div className="authors-list">
              {draft.authors.map((author: string, i: number) => (
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
              ))}
            </div>

            <button type="button" className="mbtn-add-author" onClick={addAuthor}>
              + Add author
            </button>

            <div className="mrow">
              <div className="mfield">
                <div className="mlabel">Venue</div>
                <input
                  placeholder="Venue"
                  value={draft.venue}
                  onChange={(e) => set('venue', e.target.value)}
                />
              </div>

              <div className="mfield">
                <div className="mlabel">Year</div>
                <input
                  placeholder="Year of publication"
                  value={draft.year}
                  onChange={(e) => set('year', e.target.value)}
                />
              </div>
            </div>

            <div className="mrow">
              <div className="mfield">
                <div className="mlabel">Publication type</div>
                <select
                  value={draft.publicationType}
                  onChange={(e) =>
                    set('publicationType', e.target.value as Draft['publicationType'])
                  }
                >
                  <option value="">Unspecified</option>
                  <option value="article">Article</option>
                  <option value="inproceedings">In proceedings</option>
                  <option value="misc">Misc</option>
                </select>
              </div>

              <div className="mfield">
                <div className="mlabel">DOI</div>
                <input
                  value={draft.doi}
                  onChange={(e) => set('doi', e.target.value)}
                  placeholder="10.xxxx/xxxxx"
                />
              </div>
            </div>

            <div className="mrow">
              <div className="mfield">
                <div className="mlabel">Volume</div>
                <input
                  value={draft.volume}
                  onChange={(e) => set('volume', e.target.value)}
                  placeholder="Volume"
                />
              </div>

              <div className="mfield">
                <div className="mlabel">Issue</div>
                <input
                  value={draft.issue}
                  onChange={(e) => set('issue', e.target.value)}
                  placeholder="Issue"
                />
              </div>

              <div className="mfield">
                <div className="mlabel">Pages</div>
                <input
                  value={draft.pages}
                  onChange={(e) => set('pages', e.target.value)}
                  placeholder="e.g. 12-34"
                />
              </div>
            </div>

            <div className="mfield">
              <div className="mlabel">OpenAlex</div>
              <input
                value={draft.urls.openAlex}
                onChange={(e) => setUrl('openAlex', e.target.value)}
                placeholder="openalex.org/works/:oa_id"
              />
            </div>

            <div className="mfield">
              <div className="mlabel">Semantic Scholar</div>
              <input
                value={draft.urls.semanticScholar}
                onChange={(e) => setUrl('semanticScholar', e.target.value)}
                placeholder="semanticscholar.org/paper/:ss_id"
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
                placeholder="sci-hub.pl/:sh_id"
              />
            </div>

            <div className="mfield">
              <div className="mlabel">Open Access PDF</div>
              <input
                value={draft.urls.openAccessPdf}
                onChange={(e) => setUrl('openAccessPdf', e.target.value)}
                placeholder="https://.../paper.pdf"
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

            <div className="mfield">
              <div className="mlabel">Note</div>
              <textarea
                className="note-modal-textarea"
                value={draft.note}
                onChange={(e) => set('note', e.target.value)}
                placeholder="Personal notes about this paper…"
              />
            </div>
          </div>

          <div className="mactions">
            <button className="btn-cancel" type="button" onClick={onClose}>
              Cancel
            </button>
            <button disabled={submitted} className="btn-save" type="submit">
              {submitted ? 'Saving changes...' : isEdit ? 'Save changes' : 'Add paper'}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
};
