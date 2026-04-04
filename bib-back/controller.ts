import { Request, Response } from 'express';
import { Paper } from "./types";
import { SemanticScholarClient, SemanticScholarError } from './services/semanticScholar';
import { VaultService } from './services/vault';
import { BibTeXService } from './services/bibtex';

const search = async (
  req: Request<{}, {}, {}, { q: string }>,
  res: Response<Paper[] | { message: string }>
) => {
  const { q } = req.query;

  if (!q) {
    return res.status(400).json({ message: 'Query parameter "q" is required' });
  }

  try {
    res.status(200).json(
      await SemanticScholarClient.searchPapers(q.toLowerCase())
    );
  } catch (error: any) {
    if (error instanceof SemanticScholarError) {
      res.status(error.status).json({ message: error.message });
    } else {
      res.status(500).json({ message: 'Internal server error' });
    }
  }
}

const getPapers = async (
  _: Request,
  res: Response<Paper[] | { message: string }>
) => {
  try {
    res.status(200).json(VaultService.getPapers());
  } catch (error: any) {
    console.log('[Controller] Error when obtaining saved papers:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const addPaper = async (
  req: Request,
  res: Response<Paper | { message: string }>
) => {
  const paper = req.body as Paper;

  if (!paper || !paper.id) {
    return res.status(400).json({ message: 'Paper data with id is required' });
  }

  try {
    VaultService.addPaper(paper);
    res.status(201).json(VaultService.getPaper(paper.id));
  } catch (error: any) {
    console.log('[Controller] Error when adding new paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

const updatePaper = async (
  req: Request,
  res: Response<Paper | { message: string }>
) => {
  const paper = req.body as Paper;

  try {
    VaultService.updatePaper(paper);
    res.status(200).json(VaultService.getPaper(paper.id));
  } catch (error: any) {
    console.log('[Controller] Error when updating paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const deletePaper = async (
  req: Request<{ id: string }>,
  res: Response
) => {
  const { id } = req.params;

  try {
    VaultService.removePaper(id);
    res.status(204);
  } catch (error: any) {
    console.log('[Controller] Error when removing paper:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

const generateBibTeX = async (
  req: Request<{ id: string }>,
  res: Response<{ bibtex: string } | { message: string }>
) => {
  const { id } = req.params;

  try {
    res.status(200).json({ bibtex: BibTeXService.generate(VaultService.getPaper(id)) });
  } catch (error: any) {
    console.log('[Controller] Error when generating BibTeX:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
};

interface UploadFileRequest extends Request<{ id: string }> {
  file?: Express.Multer.File;
}

const addFile = async (
  req: UploadFileRequest,
  res: Response<{ name: string } | { message: string }>
) => {
  const { id } = req.params;
  const file = req.file;

  if (!file) {
    return res.status(400).json({ message: 'No file to add' });
  }

  try {
    res.status(200).json({ name: VaultService.addFile(id, file) });
  } catch (error: any) {
    console.log('[Controller] Error when adding new file:', error);
    res.status(500).json({ message: 'Internal server error' });
  }
}

export const Controller = {
  search,
  getPapers,
  addPaper,
  updatePaper,
  deletePaper,
  generateBibTeX,
  addFile
}
