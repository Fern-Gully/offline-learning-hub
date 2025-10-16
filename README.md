# Offline Learning Hub on Raspberry Pi

## Overview
The Offline Learning Hub is a Raspberry Pi deployment that exposes a curated set of browser-based learning resources on a local area network.  It uses Nginx to serve static content such as games and reference material and relies on [Kiwix](https://kiwix.org/) to host Wikipedia and other ZIM archives.  When the Raspberry Pi is connected to the same network as learners, they can browse to **http://library.local** and access all content without an internet connection.

This repository contains the content tree that should live on the Raspberry Pi along with example configuration files for Nginx and the Kiwix service.  ZIM archives themselves are **not** included—download and copy them during deployment.

## Repository Layout

```
.
├── config/                # Deployment-ready configuration snippets
│   ├── games.conf         # Nginx location block for the HTML5 games collection
│   ├── library.conf       # Main Nginx server block
│   ├── kiwix/             # Systemd units and environment overrides for Kiwix
│   ├── lan-arcade/        # Additional LAN Arcade site config samples
│   └── lan-hybrid/        # Hybrid deployment samples
├── etc/nginx/sites-available/library.conf  # Copy of the server block used in production
├── srv/games/www/         # Browser games served at /games
├── var/www/html/          # Default web root (landing page, qfd, storms demo apps)
└── ...
```

The `etc/`, `srv/`, and `var/` directories mirror the expected hierarchy on the Raspberry Pi.  You can copy them directly to `/etc`, `/srv`, and `/var` respectively.

## Prerequisites

1. **Hardware**: Raspberry Pi 4 (2 GB or greater recommended), 32 GB microSD card, power supply.
2. **Operating System**: Raspberry Pi OS Lite (64-bit preferred).  Flash using Raspberry Pi Imager and enable SSH.
3. **Network**: The Pi must join the same LAN as learners and obtain either a static IP or DHCP reservation.  Configure local DNS/MDNS so `library.local` resolves to the Pi.
4. **Workstation**: Git installed, SSH access to the Pi, and (optionally) `rsync` for efficient file transfer.

## Initial Raspberry Pi Setup

1. Boot the Pi and identify its IP address.
2. SSH into the device (`ssh pi@<PI_IP>`).  The default password is `raspberry`; change it immediately with `passwd`.
3. Update base packages:
   ```bash
   sudo apt update && sudo apt full-upgrade -y
   sudo reboot
   ```
4. After reboot, reconnect and install runtime dependencies:
   ```bash
   sudo apt install -y nginx kiwix-tools avahi-daemon unzip rsync git
   ```
   * `nginx` serves the web content.
   * `kiwix-tools` provides the `kiwix-serve` binary.
   * `avahi-daemon` advertises `library.local` via mDNS on the LAN.

## Deploying the Repository

Once the Pi is reachable over SSH, transfer this repository and mirror the filesystem structure.

### Option A: Clone via Git on the Pi

```bash
ssh pi@<PI_IP>
# On the Pi
mkdir -p ~/src
cd ~/src
git clone https://example.com/your/offline-learning-hub.git
sudo rsync -avh --delete ~/src/offline-learning-hub/etc/ /etc/
sudo rsync -avh --delete ~/src/offline-learning-hub/srv/ /srv/
sudo rsync -avh --delete ~/src/offline-learning-hub/var/ /var/
```

### Option B: Push from Your Workstation

If you cannot install Git on the Pi (or want a clean push from your development machine), run the following from your workstation once SSH access is available:

```bash
# From your workstation inside the repository root
rsync -avh --delete etc/ pi@<PI_IP>:/etc/
rsync -avh --delete srv/ pi@<PI_IP>:/srv/
rsync -avh --delete var/ pi@<PI_IP>:/var/
rsync -avh --delete config/ pi@<PI_IP>:~/offline-learning-hub-config/
```

This copies system paths (`/etc`, `/srv`, `/var`) as well as the raw configuration assets into the Pi user's home directory for reference.

## Configuring Nginx

1. Copy the primary server block into place (if you followed the `rsync` commands above, this is already done):
   ```bash
   sudo cp /etc/nginx/sites-available/library.conf /etc/nginx/sites-enabled/library.conf
   sudo rm -f /etc/nginx/sites-enabled/default
   ```
2. Ensure the supplemental location definitions are present:
   ```bash
   sudo cp /home/pi/offline-learning-hub-config/games.conf /etc/nginx/snippets/
   sudo cp /home/pi/offline-learning-hub-config/library.conf /etc/nginx/sites-available/library.conf
   ```
   Adjust the path if you stored `config/` elsewhere.
3. Test the configuration and reload Nginx:
   ```bash
   sudo nginx -t
   sudo systemctl reload nginx
   ```
4. Confirm the landing page works by browsing to `http://library.local/` from a client on the same network.

## Installing Kiwix Content

1. Create a directory to hold ZIM archives:
   ```bash
   sudo mkdir -p /srv/kiwix/data
   sudo chown -R pi:pi /srv/kiwix
   ```
2. Download ZIM files on a workstation (e.g., from `https://download.kiwix.org/zim/`) and transfer them to the Pi:
   ```bash
   rsync -avh "<PATH_TO_ZIMS>" pi@<PI_IP>:/srv/kiwix/data/
   ```
3. Optionally generate a library XML (catalog) with `kiwix-manage`:
   ```bash
   kiwix-manage /srv/kiwix/library.xml add /srv/kiwix/data/<zim-file.zim>
   ```

## Configuring the Kiwix Service

Systemd unit files for Kiwix live under `config/kiwix/`.

1. Copy them into place:
   ```bash
   sudo cp /home/pi/offline-learning-hub-config/kiwix/kiwix-serve@.service /etc/systemd/system/
   sudo cp /home/pi/offline-learning-hub-config/kiwix/kiwix-serve@library.service /etc/systemd/system/
   sudo cp /home/pi/offline-learning-hub-config/kiwix/kiwix-serve@library.env /etc/default/
   ```
2. Edit `/etc/default/kiwix-serve@library.env` to point to your library XML or individual ZIM files.  For example:
   ```ini
   KIWIX_BIND=0.0.0.0
   KIWIX_PORT=8090
   KIWIX_LIBRARY=/srv/kiwix/library.xml
   ```
3. Enable and start the service:
   ```bash
   sudo systemctl daemon-reload
   sudo systemctl enable --now kiwix-serve@library.service
   sudo systemctl status kiwix-serve@library.service
   ```
4. Update the Nginx `library.conf` reverse proxy block if you change the Kiwix port.  By default it expects Kiwix on `http://127.0.0.1:8090`.

5. Confirm Kiwix is reachable by opening `http://library.local/kiwix/` or whichever path is configured in `games.conf`/`library.conf`.

## Routine Maintenance

* **Content updates**: Pull the latest repository changes on your workstation, then rerun the `rsync` commands to sync `/srv` and `/var`.
* **Logs**: Review Nginx logs under `/var/log/nginx/` and system logs with `journalctl -u kiwix-serve@library`.
* **Backups**: Periodically back up `/srv`, `/var/www/html`, and `/srv/kiwix/data` to external storage.

## Future Work

Currently the hub assumes the Raspberry Pi joins an existing network.  Future enhancements include configuring the Pi as a wireless access point that also presents a captive portal pointing to `library.local` without relying on upstream infrastructure.

## Troubleshooting

| Symptom | Possible Cause | Fix |
| --- | --- | --- |
| `library.local` fails to resolve | mDNS not available on client | Add a hosts entry (`<PI_IP> library.local`) or deploy a local DNS server |
| Nginx returns 502 for Kiwix pages | Kiwix service not running | `sudo systemctl status kiwix-serve@library`, ensure `.env` points to valid ZIM files |
| Content missing after reboot | Files copied into home directory only | Ensure `/srv` and `/var/www/html` are populated under root-owned paths |
| Learners can reach landing page but not games | `games.conf` snippet not included | Recopy `/etc/nginx/snippets/games.conf` and reload Nginx |

## License

Provide licensing information for bundled games and assets as required by their original authors.  Many HTML5 games included here retain their upstream licenses inside their directories.
