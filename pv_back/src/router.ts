import { Router } from "express";
import { Controller } from "./controller.js";
import { AuthService } from "./services/auth.js";
import multer from "multer";

const upload = multer({ storage: multer.memoryStorage() });

export const router = Router();

// Healthcheck
router.get("/healthcheck", Controller.healthcheck);

// Read-only mode auth
router.get("/auth/status", AuthService.status);
router.post("/auth/unlock", AuthService.unlock);
router.post("/auth/lock", AuthService.lock);

// Search for papers in the web (disabled in read-only mode)
router.get("/search", AuthService.requireAuth, Controller.search);

// Look up a single paper by DOI (or arXiv id/URL) (disabled in read-only mode)
router.get("/lookup", AuthService.requireAuth, Controller.lookupByDoi);

// Typical vault CRUD
router.get("/papers", Controller.getPapers);
router.post("/papers", AuthService.requireAuth, Controller.addPaper);
router.put("/papers/:id", AuthService.requireAuth, Controller.updatePaper);
router.delete("/papers/:id", AuthService.requireAuth, Controller.deletePaper);
router.post(
  "/papers/undo-delete",
  AuthService.requireAuth,
  Controller.undoDelete,
);

// Generate BibTeX
router.get("/papers/:id/bibtex", Controller.generateBibTeX);

// Attached files.
router.post(
  "/papers/:id/files",
  AuthService.requireAuth,
  upload.single("file"),
  Controller.addFile,
);
router.delete(
  "/papers/:id/files/:name",
  AuthService.requireAuth,
  Controller.deleteFile,
);
// Serves the file itself to the client's browser; gated inside the
// controller by READONLY_ALLOW_FILES rather than always requiring auth.
router.get("/papers/:id/files/:name/open", Controller.openFile);
