<?php
// wordlists.php — enumerates .txt wordlists in ./wordlists
header('Content-Type: application/json');
$dir = __DIR__ . '/wordlists';
$out = ['wordlists'=>[]];
if (is_dir($dir)) {
  foreach (scandir($dir) as $f) {
    if ($f === '.' || $f === '..') continue;
    if (preg_match('/\.txt$/i', $f)) {
      $path = $dir . '/' . $f;
      $lines = @file($path, FILE_IGNORE_NEW_LINES | FILE_SKIP_EMPTY_LINES) ?: [];
      $out['wordlists'][] = [
        'id' => $f,
        'filename' => $f,
        'title' => ucwords(preg_replace('/[_-]+/',' ', preg_replace('/\.txt$/','',$f))),
        'count' => count($lines)
      ];
    }
  }
}
echo json_encode($out);
