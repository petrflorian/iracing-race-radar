import fs from "node:fs/promises";
import path from "node:path";
import { PDFParse } from "pdf-parse";
import type { Request, Response } from "express";
import type { RadarSeries, RadarWeek } from "./types";

const dataDir = path.resolve(process.cwd(), ".data");
const importedSchedulePath = path.join(dataDir, "imported-schedule.json");

type ImportedSchedule = {
  importedAt: string;
  fileName: string;
  series: RadarSeries[];
};

type UploadRequest = Request & {
  file?: Express.Multer.File;
};

async function ensureDataDir() {
  await fs.mkdir(dataDir, { recursive: true, mode: 0o700 });
}

async function writeJson(filePath: string, value: unknown) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(value, null, 2), { mode: 0o600 });
}

export async function getImportedSchedule() {
  try {
    return JSON.parse(await fs.readFile(importedSchedulePath, "utf8")) as ImportedSchedule;
  } catch {
    return null;
  }
}

export async function clearImportedSchedule(_request: Request, response: Response) {
  await fs.rm(importedSchedulePath, { force: true });
  response.json({ ok: true });
}

function hashId(value: string) {
  let hash = 0;
  for (const char of value) {
    hash = (hash * 31 + char.charCodeAt(0)) | 0;
  }
  return Math.abs(hash) + 100_000;
}

function normalizeWhitespace(value: string) {
  return value.replace(/\s+/g, " ").trim();
}

function escapeRegExp(value: string) {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

function extractSportsCarTitles(text: string) {
  const start = text.indexOf("SPORTS CAR");
  const end = text.indexOf("FORMULA CAR", start);
  const sportsCarText = start >= 0 && end > start ? text.slice(start, end) : text;

  return sportsCarText
    .split("\n")
    .map((line) => normalizeWhitespace(line.replace(/(?:\s*\.\s*){3,}.*/, "")))
    .filter((line) => line.includes("Season") || line.includes("Qualifiers"))
    .filter((line) => !/Class Series \(SPORTS CAR\)|^SPORTS CAR$/i.test(line));
}

function findSeriesBlock(text: string, title: string, nextTitle?: string) {
  const start = text.indexOf(title, 20_000);
  if (start < 0) return null;

  const nextStart = nextTitle ? text.indexOf(nextTitle, start + title.length) : -1;
  const fallbackMatch = text.slice(start + title.length).match(/\n[A-Z0-9a-z][^\n]+(?:Season|Qualifiers)[^\n]*\n/);
  const fallbackEnd = fallbackMatch?.index === undefined ? -1 : start + title.length + fallbackMatch.index;
  const endCandidates = [nextStart, fallbackEnd].filter((candidate) => candidate > start);
  const end = endCandidates.length ? Math.min(...endCandidates) : text.length;

  return text.slice(start, end);
}

function parseCars(block: string) {
  const lines = block
    .split("\n")
    .map(normalizeWhitespace)
    .filter(Boolean);
  const carLines: string[] = [];

  for (const line of lines.slice(1)) {
    if (/^(Rookie|Class [A-D]|Pro\/WC)\b/.test(line)) break;
    if (/^Races\b|^Min entries|^Penalty|^No incident|^Week \d+/i.test(line)) break;
    carLines.push(line);
  }

  return normalizeWhitespace(carLines.join(" "))
    .split(/,\s*/)
    .map((car) => car.trim())
    .filter(Boolean)
    .slice(0, 14);
}

function parseLicense(block: string) {
  const match = block.match(/\n(Rookie|Class [A-D]|Pro\/WC)\b/i);
  if (!match) return undefined;
  const value = match[1].toUpperCase();
  if (value === "ROOKIE") return "R";
  if (value.startsWith("CLASS ")) return value.replace("CLASS ", "");
  return "Pro";
}

function parseRaceLength(chunk: string) {
  const match = chunk.match(/\b(\d+\s*(?:mins?|minutes?|laps))\b/i);
  return match ? match[1].replace(/minutes?/i, "mins") : undefined;
}

function parseRaceStartRule(block: string) {
  const everyMatch = block.match(/Races every\s+(.+?)(?:\n|$)/i);
  if (!everyMatch) return {};

  const rule = normalizeWhitespace(everyMatch[1]);
  const lowerRule = rule.toLowerCase();
  const everyMinutes =
    lowerRule.includes("30 minutes") || lowerRule.includes("30 mins")
      ? 30
      : lowerRule.includes("hour")
        ? Number(lowerRule.match(/(\d+)\s+hours?/)?.[1] ?? 1) * 60
        : undefined;
  const explicitOffsets = [...rule.matchAll(/:(\d{2})/g)].map((match) => Number(match[1])).filter((minute) => minute >= 0 && minute < 60);
  const minuteOffsets = explicitOffsets.length ? explicitOffsets : lowerRule.includes("on the hour") ? [0] : [];

  return {
    raceEveryMinutes: everyMinutes,
    raceMinuteOffsets: minuteOffsets.length ? Array.from(new Set(minuteOffsets)).sort((a, b) => a - b) : undefined
  };
}

function parseTrack(rawTrack: string) {
  const compact = normalizeWhitespace(rawTrack.replace(/\(\d{4}-\d{2}-\d{2}.*$/, ""));
  const separator = compact.lastIndexOf(" - ");

  if (separator <= 0) {
    return { track: compact };
  }

  return {
    track: compact.slice(0, separator).trim(),
    config: compact.slice(separator + 3).trim()
  };
}

function parseWeeks(block: string) {
  const weeks: RadarWeek[] = [];
  const weekPattern = /Week\s+(\d+)\s+\((\d{4}-\d{2}-\d{2})\)\s+([\s\S]*?)(?=\nWeek\s+\d+\s+\(\d{4}-\d{2}-\d{2}\)|$)/g;
  let match: RegExpExecArray | null;

  while ((match = weekPattern.exec(block))) {
    const [, weekNumber, startsOn, remainder] = match;
    const trackPart = remainder.split(/\n\(\d{4}-\d{2}-\d{2}/)[0];
    const { track, config } = parseTrack(trackPart);

    if (!track) continue;

    weeks.push({
      week: Number(weekNumber),
      startsOn,
      track,
      config,
      raceLength: parseRaceLength(remainder)
    });
  }

  return weeks;
}

function currentWeekFor(schedule: RadarWeek[]) {
  const now = new Date();
  const datedCurrentWeek = schedule.findLast((week) => week.startsOn && new Date(week.startsOn) <= now);
  return datedCurrentWeek?.week ?? schedule[0]?.week ?? 1;
}

export async function parseSchedulePdf(buffer: Buffer): Promise<RadarSeries[]> {
  const parser = new PDFParse({ data: buffer });
  const result = await parser.getText();
  await parser.destroy();

  const text = result.text;
  const titles = Array.from(new Set(extractSportsCarTitles(text)));

  return titles
    .map((title, index) => {
      const block = findSeriesBlock(text, title, titles[index + 1]);
      if (!block) return null;

      const schedule = parseWeeks(block);
      if (!schedule.length) return null;
      const startRule = parseRaceStartRule(block);

      const series: RadarSeries = {
        id: hashId(title),
        name: title,
        license: parseLicense(block),
        category: "Sports Car",
        cars: parseCars(block),
        fixed: /\bfixed\b/i.test(title),
        raceEveryMinutes: startRule.raceEveryMinutes,
        raceMinuteOffsets: startRule.raceMinuteOffsets,
        currentWeek: currentWeekFor(schedule),
        schedule
      };

      return series;
    })
    .filter((series): series is RadarSeries => Boolean(series));
}

export async function importSchedulePdf(request: UploadRequest, response: Response) {
  if (!request.file) {
    response.status(400).json({ error: "missing_file", message: "Upload an iRacing schedule PDF." });
    return;
  }

  try {
    const series = await parseSchedulePdf(request.file.buffer);
    if (!series.length) {
      response.status(422).json({ error: "no_series", message: "No Sports Car series could be parsed from this PDF." });
      return;
    }

    const imported = {
      importedAt: new Date().toISOString(),
      fileName: request.file.originalname,
      series
    } satisfies ImportedSchedule;

    await writeJson(importedSchedulePath, imported);

    response.json({
      source: "pdf",
      importedAt: imported.importedAt,
      fileName: imported.fileName,
      seriesCount: series.length
    });
  } catch (error) {
    response.status(422).json({
      error: "parse_failed",
      message: error instanceof Error ? error.message : "Could not parse the PDF."
    });
  }
}
