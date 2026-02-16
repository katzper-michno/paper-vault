"use client";

import { useState, useEffect, useRef } from "react";
import "./BibTeXModal.css";
import axios from 'axios';

interface BibTeXModalProps {
  paperId: string;
}

export default function BibTeXModal({ paperId }: BibTeXModalProps) {
  const SERVER_HOST = process.env.REACT_APP_BACKEND_BASE_URL;

  const [isOpen, setIsOpen] = useState<boolean>(false);
  const [bibtex, setBibtex] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(false);
  const [copied, setCopied] = useState<boolean>(false);
  const modalRef = useRef<HTMLDivElement>(null);

  // Fetch BibTeX from backend
  const fetchBibTeX = async () => {
    setLoading(true);
    try {
      const res = await axios.get<{ bibtex: string }>(`${SERVER_HOST}/papers/${paperId}/bibtex`);
      setBibtex(res.data.bibtex);
    } catch (err) {
      console.error(err);
      setBibtex("% Error fetching BibTeX");
    } finally {
      setLoading(false);
    }
  };

  const openModal = () => {
    setIsOpen(true);
    fetchBibTeX();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(bibtex);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  };

  // Close modal when clicking outside
  const handleClickOutside = (e: MouseEvent) => {
    if (modalRef.current && !modalRef.current.contains(e.target as Node)) {
      setIsOpen(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      document.addEventListener("mousedown", handleClickOutside);
    } else {
      document.removeEventListener("mousedown", handleClickOutside);
    }

    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, [isOpen]);

  return (
    <>
      <button className="bibtex-btn" onClick={openModal}>
        Show BibTeX
      </button>

      {isOpen && (
        <div className="bibtex-overlay">
          <div ref={modalRef} className="bibtex-modal fade-in">
            <button className="bibtex-close" onClick={() => setIsOpen(false)}>
              ✕
            </button>

            <h2 className="bibtex-title">Generated BibTeX</h2>

            {loading ? (
              <div className="bibtex-loading">Loading...</div>
            ) : (
              <textarea
                readOnly
                value={bibtex}
                className="bibtex-textarea"
              />
            )}

            <div className="bibtex-actions">
              <button
                className="bibtex-copy"
                onClick={handleCopy}
                disabled={loading || !bibtex}
              >
                {copied ? "Copied!" : "Copy BibTeX"}
              </button>
              <button
                className="bibtex-close-btn"
                onClick={() => setIsOpen(false)}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </>
  );
}

