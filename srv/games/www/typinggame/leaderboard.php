<?php
// leaderboard.php — simple JSON-backed leaderboard
// Requires write permission to ./data/leaderboard.json
header('Content-Type: application/json');
header('Cache-Control: no-store');

$action = $_GET['action'] ?? 'list';
$file = __DIR__ . '/data/leaderboard.json';

if (!file_exists(dirname($file))) {
  @mkdir(dirname($file), 0775, true);
}
if (!file_exists($file)) {
  file_put_contents($file, json_encode([]));
}

function read_scores($file) {
  $fh = fopen($file, 'r');
  if (!$fh) return [];
  flock($fh, LOCK_SH);
  $data = stream_get_contents($fh);
  flock($fh, LOCK_UN);
  fclose($fh);
  $arr = json_decode($data, true);
  return is_array($arr) ? $arr : [];
}
function write_scores($file, $arr) {
  $fh = fopen($file, 'c+');
  if (!$fh) { http_response_code(500); echo json_encode(['error'=>'Cannot open data file']); exit; }
  flock($fh, LOCK_EX);
  ftruncate($fh, 0);
  fwrite($fh, json_encode($arr, JSON_PRETTY_PRINT));
  fflush($fh);
  flock($fh, LOCK_UN);
  fclose($fh);
}

if ($action === 'list') {
  $scores = read_scores($file);
  // Optional filters
  $difficulty = $_GET['difficulty'] ?? '';
  $wordlist = $_GET['wordlist'] ?? '';
  if ($difficulty !== '') {
    $scores = array_values(array_filter($scores, fn($s) => ($s['difficulty'] ?? '') === $difficulty));
  }
  if ($wordlist !== '') {
    $scores = array_values(array_filter($scores, fn($s) => ($s['wordlist'] ?? '') === $wordlist));
  }
  // sort desc by score
  usort($scores, fn($a,$b) => ($b['score']??0) <=> ($a['score']??0));
  $scores = array_slice($scores, 0, 100);
  echo json_encode($scores);
  exit;
}

if ($action === 'submit' && $_SERVER['REQUEST_METHOD'] === 'POST') {
  $raw = file_get_contents('php://input');
  $payload = json_decode($raw, true);
  if (!$payload) { http_response_code(400); echo json_encode(['error'=>'Invalid JSON']); exit; }

  // sanitize
  $name = substr(trim($payload['name'] ?? 'Player'), 0, 20);
  $score = intval($payload['score'] ?? 0);
  $wpm = intval($payload['wpm'] ?? 0);
  $acc = floatval($payload['acc'] ?? 0);
  $level = intval($payload['level'] ?? 1);
  $difficulty = preg_replace('/[^a-z]/', '', strtolower($payload['difficulty'] ?? ''));
  $wordlist = basename($payload['wordlist'] ?? '');
  $mode = preg_replace('/[^a-z]/', '', strtolower($payload['mode'] ?? 'classic'));
  $date = date('c');

  if ($score <= 0) { http_response_code(400); echo json_encode(['error'=>'Score must be > 0']); exit; }

  $entry = compact('name','score','wpm','acc','level','difficulty','wordlist','mode','date','ip');
  $entry['ip'] = $_SERVER['REMOTE_ADDR'] ?? '';

  $scores = read_scores($file);
  $scores[] = $entry;
  // Keep top 200 by score
  usort($scores, fn($a,$b) => ($b['score']??0) <=> ($a['score']??0));
  $scores = array_slice($scores, 0, 200);
  write_scores($file, $scores);

  echo json_encode(['ok'=>true]);
  exit;
}

http_response_code(404);
echo json_encode(['error'=>'Unknown action']);
