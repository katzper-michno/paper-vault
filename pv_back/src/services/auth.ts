import { Request, Response, NextFunction } from "express";
import { timingSafeEqual } from "node:crypto";

const COOKIE_NAME = "pv_secret";
const COOKIE_MAX_AGE_MS = 1000 * 60 * 60 * 24 * 365;

const getSecret = (): string => process.env.READONLY_SECRET ?? "";

const isEnabled = (): boolean => getSecret().length > 0;

const allowNotesInReadOnly = (): boolean =>
  (process.env.READONLY_ALLOW_NOTES ?? "false").toLowerCase() === "true";

const allowFilesInReadOnly = (): boolean =>
  (process.env.READONLY_ALLOW_FILES ?? "false").toLowerCase() === "true";

const parseCookies = (header: string | undefined): Record<string, string> => {
  const cookies: Record<string, string> = {};
  if (!header) return cookies;

  for (const part of header.split(";")) {
    const idx = part.indexOf("=");
    if (idx === -1) continue;
    const key = part.slice(0, idx).trim();
    const value = part.slice(idx + 1).trim();
    if (key) cookies[key] = decodeURIComponent(value);
  }

  return cookies;
};

const safeCompare = (a: string, b: string): boolean => {
  const bufA = Buffer.from(a);
  const bufB = Buffer.from(b);
  if (bufA.length !== bufB.length) return false;
  return timingSafeEqual(bufA, bufB);
};

const isAuthenticated = (req: Request): boolean => {
  const secret = getSecret();
  if (!secret) return true;

  const token = parseCookies(req.headers.cookie)[COOKIE_NAME];
  return Boolean(token) && safeCompare(token, secret);
};

const requireAuth = (req: Request, res: Response, next: NextFunction) => {
  if (isAuthenticated(req)) return next();

  res.status(401).json({
    message:
      "This vault is read-only. Unlock full access with the access code to make changes.",
  });
};

const status = (req: Request, res: Response) => {
  res.status(200).json({
    authEnabled: isEnabled(),
    readOnly: !isAuthenticated(req),
    allowNotes: allowNotesInReadOnly(),
    allowFiles: allowFilesInReadOnly(),
  });
};

const unlock = (req: Request, res: Response) => {
  const secret = getSecret();
  if (!secret) {
    return res
      .status(400)
      .json({ message: "Read-only mode is not enabled on this server" });
  }

  const provided = req.body?.secret;
  if (typeof provided !== "string" || !safeCompare(provided, secret)) {
    return res.status(401).json({ message: "Invalid access code" });
  }

  res.cookie(COOKIE_NAME, secret, {
    httpOnly: true,
    sameSite: "lax",
    maxAge: COOKIE_MAX_AGE_MS,
    path: "/",
  });

  res.status(200).json({ message: "Unlocked" });
};

const lock = (_req: Request, res: Response) => {
  res.clearCookie(COOKIE_NAME, { path: "/" });
  res.status(200).json({ message: "Locked" });
};

export const AuthService = {
  isAuthenticated,
  allowNotesInReadOnly,
  allowFilesInReadOnly,
  requireAuth,
  status,
  unlock,
  lock,
};
