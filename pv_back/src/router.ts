import { Router } from "express";
import { Controller } from "./controller.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const router = Router();

// Healthcheck
router.get("/healthcheck", Controller.healthcheck);

// Search for papers in the web
router.get("/search", Controller.search);

// Typical vault CRUD
router.get("/papers", Controller.getPapers);
router.post("/papers", Controller.addPaper);
router.put("/papers/:id", Controller.updatePaper);
router.delete("/papers/:id", Controller.deletePaper);

// Generate BibTeX
router.get("/papers/:id/bibtex", Controller.generateBibTeX);

// Attached files
router.post("/papers/:id/files", upload.single("file"), Controller.addFile);
router.delete("/papers/:id/files/:name", Controller.deleteFile);
router.get("/papers/:id/files/open", Controller.openFilesDir);
router.get("/papers/:id/files/:name/open", Controller.openFile);
