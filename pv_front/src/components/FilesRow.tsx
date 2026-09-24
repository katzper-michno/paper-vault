import { useState } from 'react';
import { Paper } from '../types';
import { useFilePicker } from 'use-file-picker';
import { SelectedFiles } from 'use-file-picker/types';

interface FilesRowProps {
  paper: Paper;
  onAddFile: (file: File) => Promise<void>;
  onRemoveFile: (name: string) => Promise<void>;
  onOpenFilesDirectory: () => Promise<void>;
  onOpenFile: (name: string) => Promise<void>;
}

const EXT_COLORS: Record<string, string> = {
  pdf: '#d94040',
  png: '#38a05c', jpg: '#38a05c', jpeg: '#38a05c', gif: '#38a05c',
  svg: '#38a05c', webp: '#38a05c', heic: '#38a05c',
  doc: '#2b6cbf', docx: '#2b6cbf', txt: '#6080a0', md: '#6080a0',
  xls: '#1f8a4c', xlsx: '#1f8a4c', csv: '#1f8a4c',
  ppt: '#c94f0d', pptx: '#c94f0d',
  zip: '#7b4fbf', tar: '#7b4fbf', gz: '#7b4fbf', rar: '#7b4fbf',
  py: '#3572a5', js: '#c8a000', ts: '#2b6cbf', rs: '#c94f0d',
};

const getExtColor = (name: string): string => {
  const ext = name.split('.').pop()?.toLowerCase() ?? '';
  return EXT_COLORS[ext] ?? '#888888';
};

const getExt = (name: string): string =>
  (name.split('.').pop() ?? 'file').toUpperCase().slice(0, 5);

export const FilesRow: React.FC<FilesRowProps> = ({
  paper,
  onAddFile,
  onRemoveFile,
  onOpenFile,
  onOpenFilesDirectory,
}) => {
  const fileCount = paper.files.length;

  const [adding, setAdding] = useState(false);
  const [openingDir, setOpeningDir] = useState(false);
  const [removing, setRemoving] = useState<string[]>([]);
  const [opening, setOpening] = useState<string[]>([]);

  const { openFilePicker, loading: loadingFile } = useFilePicker({
    multiple: false,
    onFilesSuccessfullySelected: async ({ plainFiles }: SelectedFiles<unknown>) => {
      if (plainFiles?.length === 1) {
        setAdding(true);
        try {
          await onAddFile(plainFiles[0]);
        } finally {
          setAdding(false);
        }
      }
    },
  });

  const handleRemove = async (idx: number) => {
    const name = paper.files[idx];
    setRemoving((prev) => [...prev, name]);
    await onRemoveFile(name);
    setRemoving((prev) => prev.filter((n) => n !== name));
  };

  const handleDirOpen = async () => {
    setOpeningDir(true);
    await onOpenFilesDirectory();
    setTimeout(() => setOpeningDir(false), 1500);
  };

  const handleOpen = async (idx: number) => {
    const name = paper.files[idx];
    setOpening((prev) => [...prev, name]);
    await onOpenFile(name);
    setTimeout(() => setOpening((prev) => prev.filter((n) => n !== name)), 1500);
  };

  return (
    <div className="files-section">
      {fileCount > 0 && (
        <div className="files-mosaic">
          {paper.files.map((f, i) => {
            const busy = opening.includes(f) || removing.includes(f);
            const color = getExtColor(f);
            return (
              <div
                key={i}
                className={`file-tile${busy ? ' busy' : ''}`}
                onClick={() => !busy && handleOpen(i)}
                title={f}
              >
                <span className="file-tile-ext" style={{ background: color }}>
                  {getExt(f)}
                </span>
                <span className="file-tile-name">{f}</span>
                <button
                  className="file-tile-del"
                  onClick={(e) => { e.stopPropagation(); handleRemove(i); }}
                  disabled={busy}
                  title="Remove file"
                >
                  ×
                </button>
              </div>
            );
          })}
        </div>
      )}

      <div className="files-actions">
        <button
          disabled={adding || loadingFile}
          onClick={openFilePicker}
          className="act-btn"
        >
          {adding || loadingFile ? 'Adding…' : '+ Attach'}
        </button>
        <button disabled={openingDir} onClick={handleDirOpen} className="act-btn">
          {openingDir ? 'Opening…' : '> Open dir'}
        </button>
      </div>
    </div>
  );
};
