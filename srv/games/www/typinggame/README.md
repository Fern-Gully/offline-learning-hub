# TypeRush — HTML5 Typing Game

Drop this folder into `/var/www/html/typinggame/` (or any Nginx root).

## Features
- Canvas‑based falling words, progressive difficulty & levels
- Beginner/Normal/Challenge + Classic/Marathon/Timed modes
- Golden bonus words: **Slow Time**, **Blast (clear 3)**, **x2 Score**
- Local progress (best score per setup) saved in `localStorage`
- Server‑side leaderboard (`leaderboard.php`) using a JSON file with file‑locking
- Dynamic wordlist discovery via `wordlists.php` **or** static `wordlists/index.json`
- No external CDN deps; works offline

## Deploy (Nginx + PHP‑FPM)
1. Ensure PHP is enabled for this vhost (Debian/RPi OS):
   ```bash
   sudo apt-get install -y php-fpm
   # In your Nginx server block:
   # location ~ \.php$ { include snippets/fastcgi-php.conf; fastcgi_pass unix:/run/php/php-fpm.sock; }
   sudo systemctl restart php*-fpm nginx
   ```
2. Copy files:
   ```bash
   sudo rsync -a ./typinggame/ /var/www/html/typinggame/
   sudo chown -R www-data:www-data /var/www/html/typinggame/data
   ```
3. Visit: `http://<pi>/typinggame/`

## Wordlists
- Put `.txt` files in `wordlists/` (one word per line).
- If PHP is enabled, the game auto‑lists them via `wordlists.php`.
- Otherwise, build a static manifest once:
  ```bash
  bash build_manifest.sh
  ```

## API
- `GET leaderboard.php?action=list[&difficulty=...&wordlist=...]` → top scores
- `POST leaderboard.php?action=submit` JSON body:
  ```json
  {"name":"DC","score":1234,"wpm":42,"acc":0.93,"level":7,"difficulty":"normal","wordlist":"animals.txt","mode":"classic"}
  ```

## Notes
- Leaderboard data lives at `data/leaderboard.json`. Make it writable by your web user.
- Everything runs offline. Sounds are generated via WebAudio (no libraries).
- For kiosk use, consider adding the folder to your arcade index and setting up a service worker (optional).
