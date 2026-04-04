import { Router } from 'express';
import { Controller } from './controller';

export const router = Router();

router.get('/search', Controller.search);
router.get('/papers', Controller.getPapers);
router.post('/papers', Controller.addPaper);
router.put('/papers/:id', Controller.updatePaper);
router.delete('/papers/:id', Controller.deletePaper);
router.get('/papers/:id/bibtex', Controller.generateBibTeX);
