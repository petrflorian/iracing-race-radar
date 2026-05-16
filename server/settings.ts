import fs from "node:fs/promises";
import path from "node:path";
import type { Request, Response } from "express";

const dataDir = path.resolve(process.cwd(), ".data");
const settingsPath = path.join(dataDir, "settings.json");

export type AppSettings = {
  selectedSeries: number[];
  ownedTracks: string[];
  updatedAt?: string;
};

const emptySettings: AppSettings = {
  selectedSeries: [],
  ownedTracks: []
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
}

function sanitizeSettings(value: unknown): AppSettings {
  const record = value && typeof value === "object" ? (value as Record<string, unknown>) : {};
  const selectedSeries = Array.isArray(record.selectedSeries)
    ? record.selectedSeries.filter((item): item is number => typeof item === "number" && Number.isFinite(item))
    : [];
  const ownedTracks = Array.isArray(record.ownedTracks)
    ? record.ownedTracks.filter((item): item is string => typeof item === "string" && item.trim().length > 0).map((item) => item.trim())
    : [];

  return {
    selectedSeries: Array.from(new Set(selectedSeries)),
    ownedTracks: Array.from(new Set(ownedTracks)),
    updatedAt: typeof record.updatedAt === "string" ? record.updatedAt : undefined
  };
}

export async function readSettings(): Promise<{ settings: AppSettings; exists: boolean }> {
  try {
    return {
      settings: sanitizeSettings(JSON.parse(await fs.readFile(settingsPath, "utf8"))),
      exists: true
    };
  } catch {
    return {
      settings: emptySettings,
      exists: false
    };
  }
}

export async function writeSettings(settings: AppSettings) {
  await ensureDataDir();
  const sanitized = sanitizeSettings({
    ...settings,
    updatedAt: new Date().toISOString()
  });
  await fs.writeFile(settingsPath, JSON.stringify(sanitized, null, 2), { mode: 0o600 });
  return sanitized;
}

export async function getSettings(_request: Request, response: Response) {
  const { settings, exists } = await readSettings();
  response.json({ ...settings, exists });
}

export async function updateSettings(request: Request, response: Response) {
  const nextSettings = await writeSettings(sanitizeSettings(request.body));
  response.json({ ...nextSettings, exists: true });
}
