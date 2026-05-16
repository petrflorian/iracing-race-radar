# Unraid installation

This app is intended to run as a local Docker container on your LAN.

Recommended path for personal use: Docker Compose on Unraid.

Community Apps is possible later, but it needs a published Docker image and a public Unraid template repository.

## Option A: Install with Docker Compose

Use this if the app is only for your own Unraid server.

### 1. Prepare folders

In Unraid terminal:

```bash
mkdir -p /mnt/user/appdata/iracing-race-radar
cd /mnt/user/appdata/iracing-race-radar
```

### 2. Copy or clone the project

Preferred, if the project is in git:

```bash
git clone <repo-url> app
cd app
```

If the project is not in git yet, copy the project folder to:

```text
/mnt/user/appdata/iracing-race-radar/app
```

Then enter it:

```bash
cd /mnt/user/appdata/iracing-race-radar/app
```

### 3. Create `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
PORT=8787
DATA_DIR=/mnt/user/appdata/iracing-race-radar/data
TZ=Europe/Prague
```

### 4. Start the app

```bash
./scripts/install.sh
```

Open:

```text
http://<unraid-ip>:8787
```

Example:

```text
http://192.168.1.10:8787
```

### 5. Update

```bash
cd /mnt/user/appdata/iracing-race-radar/app
./scripts/update.sh
```

If the app directory is a git checkout, the script pulls the latest code and rebuilds the container.

If you copied files manually, replace the app files first, then run:

```bash
./scripts/update.sh
```

### 6. Backup

```bash
cd /mnt/user/appdata/iracing-race-radar/app
./scripts/backup.sh
```

Important data is stored in:

```text
/mnt/user/appdata/iracing-race-radar/data
```

Back up this folder. It contains the imported PDF calendar, watched series, and owned tracks.

## Option B: Install manually with Add Container

Use this only after a Docker image has been published, for example:

```text
ghcr.io/<owner>/iracing-race-radar:latest
```

In Unraid Web UI:

1. Go to `Docker`.
2. Click `Add Container`.
3. Set `Name`:

```text
iracing-race-radar
```

4. Set `Repository`:

```text
ghcr.io/<owner>/iracing-race-radar:latest
```

5. Add port mapping:

```text
Host Port:      8787
Container Port: 8787
Protocol:       TCP
```

6. Add path mapping:

```text
Host Path:      /mnt/user/appdata/iracing-race-radar/data
Container Path: /app/.data
Access Mode:    Read/Write
```

7. Add environment variables:

```text
NODE_ENV=production
PORT=8787
TZ=Europe/Prague
```

8. Apply.

Open:

```text
http://<unraid-ip>:8787
```

## Option C: Publish to Community Apps

Community Apps is for making the app searchable/installable from the Unraid Apps tab.

To do that cleanly, prepare:

1. A public source repository.
2. A published Docker image, usually on GitHub Container Registry or Docker Hub.
3. A public Unraid template repository containing a valid Docker XML template.
4. A support URL, usually the GitHub repository or forum thread.
5. Submit the template repository to Community Apps.

### Suggested repository layout

```text
iracing-race-radar/
  Dockerfile
  docker-compose.yml
  src/
  server/
  docs/

unraid-templates/
  iracing-race-radar.xml
```

The Community Apps template should point to the published image, not build from this repository.

### Template values

Use these defaults:

```text
Name: iracing-race-radar
Repository: ghcr.io/<owner>/iracing-race-radar:latest
Web UI: http://[IP]:[PORT:8787]
Container port: 8787
Default host port: 8787
Container data path: /app/.data
Default host data path: /mnt/user/appdata/iracing-race-radar/data
Environment:
  NODE_ENV=production
  PORT=8787
  TZ=Europe/Prague
```

After publishing the template repository, submit it here:

```text
https://ca.unraid.net/submit
```

## Security note

Keep the app on your LAN or behind VPN. It has no authentication.
