import React, { useState, useEffect, FormEvent, ChangeEvent, ReactNode } from 'react';
import './App.css';
import axios from 'axios';
import BibTeXModal from './BibTeXModal/BibTeXModal';
import { Paper } from './types';
import Search from './Search/Search';
import { Slide, ToastContainer } from 'react-toastify';
import SavedPapers from './SavedPapers/SavedPapers';

interface LoadingState {
  load: boolean;
}

const App: React.FC = () => {
  const SERVER_HOST = process.env.REACT_APP_BACKEND_BASE_URL;

  const [savedPapers, setSavedPapers] = useState<Paper[]>([]);
  const [loading, setLoading] = useState<LoadingState>({ load: false });

  useEffect(() => {
    fetchSavedPapers();
  }, []);

  const fetchSavedPapers = async (): Promise<void> => {
    setLoading(prev => ({ ...prev, load: true }));
    try {
      const res = await axios.get<Paper[]>(`${SERVER_HOST}/papers`);
      setSavedPapers(res.data);
    } catch (err: any) {
      console.error(err);
      setSavedPapers(err.response.data.message);
    } finally {
      setLoading(prev => ({ ...prev, load: false }));
    }
  };

  return (
    <div className="app">
      <div className="main-container">
        <Search
          onSavedPaperSuccess={(paper: Paper) =>
            setSavedPapers(prev => [paper, ...prev])
          }
          savedPapers={loading.load ? undefined : savedPapers}
        />
        <SavedPapers
          onDeletedPaperSuccess={(deletedId: string) => setSavedPapers(prev => prev.filter((p: Paper) => p.id !== deletedId))}
          savedPapers={loading.load ? undefined : savedPapers}
        />
        <ToastContainer
          position="bottom-left"
          autoClose={5000}
          hideProgressBar={false}
          newestOnTop={false}
          closeOnClick={false}
          rtl={false}
          pauseOnFocusLoss
          draggable
          pauseOnHover
          theme="colored"
          transition={Slide}
        />
      </div>
    </div>
  );
};

export default App;
