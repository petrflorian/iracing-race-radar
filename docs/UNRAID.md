# Unraid installation

This app is intended to run as a local Docker container on your LAN.

Recommended path for personal use: install from the published GHCR image.

The older Docker Compose flow still works, but Unraid's Docker page can only show normal image updates when the container is based on a remote image such as GHCR.

## Option A: Install with Add Container

Use this if you want Unraid to show normal update status and an `apply update` action.

### 1. Prepare the data folder

In Unraid terminal:

```bash
mkdir -p /mnt/user/appdata/iracing-race-radar/data
```

### 2. Add the container

In Unraid Web UI:

1. Go to `Docker`.
2. Click `Add Container`.
3. Set `Name`:

```text
iracing-race-radar
```

4. Set `Repository`:

```text
ghcr.io/petrflorian/iracing-race-radar:latest
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

Example:

```text
http://192.168.1.10:8787
```

### 3. Updates

When a new image is published, Unraid should show an update action in the Docker page.

The data folder is bind-mounted, so updating the image does not remove the imported calendar or settings.

## Option B: Install with Docker Compose

Use this if you prefer managing the app from terminal.

### 1. Prepare folders

In Unraid terminal:

```bash
mkdir -p /mnt/user/appdata/iracing-race-radar
cd /mnt/user/appdata/iracing-race-radar
```

### 2. Clone the project

```bash
git clone https://github.com/petrflorian/iracing-race-radar.git app
cd app
```

### 3. Create `.env`

```bash
cp .env.example .env
```

Edit `.env`:

```dotenv
PORT=8787
DATA_DIR=/mnt/user/appdata/iracing-race-radar/data
IMAGE=ghcr.io/petrflorian/iracing-race-radar:latest
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

### 5. Terminal update

```bash
cd /mnt/user/appdata/iracing-race-radar/app
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

## Optional: Use the local template XML

This repository includes an Unraid Docker template:

```text
unraid/iracing-race-radar.xml
```

It points to:

```text
ghcr.io/petrflorian/iracing-race-radar:latest
```

## Publish to Community Apps

Community Apps is for making the app searchable/installable from the Unraid Apps tab.

To do that cleanly, prepare or verify:

1. A public source repository.
2. A published Docker image on GitHub Container Registry.
3. A public Unraid template XML.
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

unraid/
  iracing-race-radar.xml
```

The Community Apps template should point to the published image, not build from this repository.

### Template values

Use these defaults:

```text
Name: iracing-race-radar
Repository: ghcr.io/petrflorian/iracing-race-radar:latest
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
