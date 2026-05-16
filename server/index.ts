import express from "express";
import path from "node:path";
import { fileURLToPath } from "node:url";
import multer from "multer";
import { getSportsCarRadar } from "./iracing";
import { clearImportedSchedule, importSchedulePdf } from "./pdfImport";
import { getSettings, updateSettings } from "./settings";

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const app = express();
const port = Number(process.env.PORT ?? 8787);
const upload = multer({
  storage: multer.memoryStorage(),
  limits: { fileSize: 12 * 1024 * 1024 },
  fileFilter: (_request, file, callback) => {
    if (file.mimetype === "application/pdf" || file.originalname.toLowerCase().endsWith(".pdf")) {
      callback(null, true);
      return;
    }
    callback(new Error("Only PDF files are supported."));
  }
});

app.use(express.json());

app.get("/api/health", (_request, response) => {
  response.json({ ok: true });
});

app.get("/api/settings", getSettings);
app.put("/api/settings", updateSettings);

app.post("/api/import/pdf", upload.single("schedule"), importSchedulePdf);
app.delete("/api/import/pdf", clearImportedSchedule);

app.get("/api/radar", async (_request, response) => {
  response.json(await getSportsCarRadar());
});

if (process.env.NODE_ENV === "production") {
  const distDir = path.resolve(__dirname, "../dist");
  app.use(express.static(distDir));
  app.use((_request, response) => {
    response.sendFile(path.join(distDir, "index.html"));
  });
}

app.listen(port, () => {
  console.log(`Race radar API listening on http://localhost:${port}`);
});
