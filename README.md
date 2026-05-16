# iRacing Race Radar

Personal web app for tracking selected iRacing Sports Car series without clicking through the iRacing UI.

## Run locally

For development:

```bash
npm install
npm run dev
```

Open <http://localhost:5173>.

The Vite frontend runs on port `5173`; the Express backend runs on port `8787`.

## Local Install

For normal local use, run it with Docker Compose. The app data stays outside the container, so updates do not delete your imported calendar, watched series, or owned tracks.

Best installation flow is to keep the app as a git checkout:

```bash
git clone <repo-url> iracing-race-radar
cd iracing-race-radar
```

Then start it:

```bash
cp .env.example .env
./scripts/install.sh
```

Open <http://localhost:8787>.

Persistent data is stored in the directory configured by `DATA_DIR` in `.env`. By default:

```text
.data/
```

To update later:

```bash
./scripts/update.sh
```

If this directory is a git checkout, the update script pulls the latest code before rebuilding. If you copied the files manually, replace the project files first and then run the same update script.

To create a backup:

```bash
./scripts/backup.sh
```

Backups are written to:

```text
backups/
```

## Unraid / Home Server

Recommended setup for Unraid is Docker Compose with a bind-mounted data directory.

Full Unraid guide:

```text
docs/UNRAID.md
```

1. Put this project somewhere persistent, for example under appdata.
2. Create `.env` from `.env.example`.
3. Set `DATA_DIR` to an appdata path.
4. Run Docker Compose.

Example `.env`:

```dotenv
PORT=8787
DATA_DIR=/mnt/user/appdata/iracing-race-radar/data
IMAGE=ghcr.io/petrflorian/iracing-race-radar:latest
TZ=Europe/Prague
```

Start or update:

```bash
./scripts/update.sh
```

Expose it only on your LAN/VPN. The app has no login screen.

## Data Source

The app uses official iRacing Season Schedule PDFs.

1. Open settings with the cog button.
2. Import the official `SeasonSchedule.pdf`.
3. The backend extracts Sports Car series, cars, weekly tracks, race lengths, and regular start rules.

Imported data is stored in:

```text
.data/imported-schedule.json
```

If no PDF has been imported, the backend serves sample data.

## Settings

Settings are stored by the backend in:

```text
.data/settings.json
```

This makes the same watchlist and owned-track list available from any browser/device that reaches the same backend.

The settings page contains:

- calendar PDF import
- watched series selection
- owned tracks checklist
- search/filter controls for series and tracks

## Main Views

`Watchlist` shows only selected series. Rows are grouped by car/category:

- Mazda MX-5
- Toyota GR86
- GT3
- Porsche Cup
- Ferrari 296 Challenge
- Other

Each watched series row shows:

- next regular race start time, when parseable from the PDF
- race length
- current week track
- next week track
- owned-track highlighting by color

Click a row to show details: cars, upcoming weeks, and the remove-from-watchlist action.

`Discover` shows current and upcoming Sports Car combinations outside the watchlist, with filtering by track, car, or series.

## Owned Tracks

Owned tracks are stored as normalized track names. In the watchlist:

- green highlight means the track is owned
- orange highlight means the track is missing

No text label is shown in the row; the color is the signal.

## Backend API

```text
GET    /api/radar
GET    /api/settings
PUT    /api/settings
POST   /api/import/pdf
DELETE /api/import/pdf
```

## Notes

- No iRacing login or OAuth is used.
- Existing browser `localStorage` watchlist values are migrated to backend settings when possible.
- Some endurance or special-event series do not expose a regular `Races every ... at :...` rule in the PDF; those show `-` for next start time.
