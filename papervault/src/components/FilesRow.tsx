import { useState } from "react"
import { Paper } from "../types"
import { useFilePicker } from "use-file-picker"
import { SelectedFiles } from "use-file-picker/types"

interface FilesRowProps {
  paper: Paper,
  onAddFile: (file: File) => Promise<void>
  onRemoveFile: (name: string) => Promise<void>
  onOpenFile: (name: string) => Promise<void>
}

export const FilesRow: React.FC<FilesRowProps> = ({ paper, onAddFile, onRemoveFile, onOpenFile }) => {
  const [filesOpen, setFilesOpen] = useState<boolean>(false);

  const fileCount = paper.files.length;

  const [adding, setAdding] = useState<boolean>(false);
  const [removing, setRemoving] = useState<boolean[]>(new Array(fileCount).fill(false));
  const [opening, setOpening] = useState<boolean[]>(new Array(fileCount).fill(false));

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
    }
  });

  const handleAdd = openFilePicker;

  const handleRemove = async (idx: number) => {
    setRemoving(prev => { prev[idx] = true; return prev });
    await onRemoveFile(paper.files[idx]);
    setRemoving(prev => { prev[idx] = false; return prev });
  }

  const handleOpen = async (idx: number) => {
    setOpening(prev => { prev[idx] = true; return prev });
    await onOpenFile(paper.files[idx]);
    setOpening(prev => { prev[idx] = false; return prev });
  }

  return (
    <div className="files-section">
      <div className="files-row">
        <button className="files-toggle" onClick={() => setFilesOpen(o => !o)}>
          <span className={`arrow${filesOpen ? ' open' : ''}`}>›</span>
          {fileCount > 0
            ? `${fileCount} attached file${fileCount > 1 ? 's' : ''}`
            : 'No files'}
        </button>
        <button
          disabled={adding || loadingFile}
          onClick={handleAdd}
          className="act-files-btn attach"
        >
          {(adding || loadingFile) ? 'Adding...' : '+ Attach'}
        </button>
        <button
          onClick={() => window.alert('This is not yet implemented...')}
          className="act-files-btn open-dir"
        >
          🗀 Open directory
        </button>
      </div>

      {filesOpen && fileCount > 0 && (
        <div className="files-list">
          {paper.files.map((f, i) => {
            const modifyLock = opening[i] || removing[i];
            return (
              <div className="file-item" key={i}>
                <span className="file-icon">⎙</span>
                <span className="file-name">{f}</span>
                <button
                  disabled={modifyLock}
                  className="act-file-btn open"
                  onClick={() => handleOpen(i)}
                >
                  {(opening) ? 'Opening...' : 'Open'}
                </button>
                <button
                  disabled={modifyLock}
                  className="act-file-btn del"
                  onClick={() => handleRemove(i)}
                >
                  {(removing) ? 'Removing...' : 'Remove'}
                </button>
              </div>
            )
          })}
        </div>
      )}
    </div>
  );
}
