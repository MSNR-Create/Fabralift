<?php
/**
 * Fabralift ranking API  (c) MSNR_Create  MIT License
 *
 * GET  rank.php?d=easy|normal|hard&scope=today|all&seed=YYYYMMDD  -> {"list":[...]}
 * POST rank.php  {"name","time","b","d","seed","v"}                -> {"ok":true,"rank":n}
 *
 * IMPORTANT: ranking data is stored OUTSIDE the game folder (DATA_DIR) so that
 * re-uploading / replacing the game files never deletes it.
 */
declare(strict_types=1);
date_default_timezone_set('Asia/Tokyo');

// ---- config -------------------------------------------------------------
// Default: a sibling folder of the game folder, e.g.
//   public_html/fabralift/        <- game (replace freely)
//   public_html/fabralift-data/   <- ranking data (never overwrite)
// Better: point this to a folder outside public_html via env FABRALIFT_DATA_DIR.
const MAX_KEEP = 5000;          // records kept per difficulty
const LIST_SIZE = 20;
const MIN_TIME = 15.0;          // seconds — reject impossible times
const THROTTLE_SEC = 5;         // 1 post per IP per N seconds
$DATA_DIR = getenv('FABRALIFT_DATA_DIR') ?: dirname(__DIR__) . '/fabralift-data';
// -------------------------------------------------------------------------

header('Content-Type: application/json; charset=utf-8');
header('Cache-Control: no-store');
header('X-Content-Type-Options: nosniff');

function out(array $a, int $code = 200): void { http_response_code($code); echo json_encode($a, JSON_UNESCAPED_UNICODE); exit; }

if (!is_dir($DATA_DIR) && !@mkdir($DATA_DIR, 0775, true)) out(['error' => 'storage'], 500);
if (!file_exists("$DATA_DIR/.htaccess")) @file_put_contents("$DATA_DIR/.htaccess", "Require all denied\nDeny from all\n");

$diffs = ['easy', 'normal', 'hard'];

/** run $fn on the decoded file while holding an exclusive lock; $fn may return a new array to save */
function with_file(string $path, callable $fn, bool $write) {
    $fp = fopen($path, 'c+'); if (!$fp) out(['error' => 'storage'], 500);
    flock($fp, $write ? LOCK_EX : LOCK_SH);
    $raw = stream_get_contents($fp);
    $data = $raw ? (json_decode($raw, true) ?: []) : [];
    $res = $fn($data);
    if ($write && is_array($res)) {
        // write via temp + rename-like truncate under lock; keep a backup copy first
        @copy($path, $path . '.bak');
        ftruncate($fp, 0); rewind($fp);
        fwrite($fp, json_encode($res, JSON_UNESCAPED_UNICODE));
        fflush($fp);
    }
    flock($fp, LOCK_UN); fclose($fp);
    return $res;
}

$method = $_SERVER['REQUEST_METHOD'] ?? 'GET';

if ($method === 'GET') {
    $d = $_GET['d'] ?? 'easy';
    if (!in_array($d, $diffs, true)) out(['error' => 'bad d'], 400);
    $scope = ($_GET['scope'] ?? 'today') === 'all' ? 'all' : 'today';
    $seed = (int)($_GET['seed'] ?? date('Ymd'));
    $path = "$DATA_DIR/rank_$d.json";
    if (!file_exists($path)) out(['list' => []]);
    $list = with_file($path, fn($data) => $data, false);
    if ($scope === 'today') $list = array_values(array_filter($list, fn($r) => (int)$r['seed'] === $seed));
    $list = array_map(fn($r) => ['name' => $r['name'], 'time' => $r['time'], 'b' => $r['b'], 'seed' => $r['seed']], array_slice($list, 0, LIST_SIZE));
    out(['list' => $list]);
}

if ($method === 'POST') {
    $in = json_decode((string)file_get_contents('php://input'), true);
    if (!is_array($in)) out(['error' => 'bad json'], 400);
    $d = $in['d'] ?? '';
    if (!in_array($d, $diffs, true)) out(['error' => 'bad d'], 400);
    $time = round((float)($in['time'] ?? 0), 1);
    $b = (int)($in['b'] ?? 0);
    $seed = (int)($in['seed'] ?? 0);
    $name = preg_replace('/[\x00-\x1F\x7F<>]/u', '', (string)($in['name'] ?? ''));
    $name = mb_substr(trim($name), 0, 12) ?: 'NoName';
    if ($time < MIN_TIME || $time > 36000 || $b < 1 || $b > 400) out(['error' => 'invalid'], 400);
    // only today's daily map (±1 day for other time zones)
    $ok = false;
    foreach ([-1, 0, 1] as $o) if ($seed === (int)date('Ymd', strtotime("$o day"))) $ok = true;
    if (!$ok) out(['error' => 'seed'], 400);
    // throttle
    $ip = hash('sha256', ($_SERVER['REMOTE_ADDR'] ?? '') . 'fabralift');
    $tf = "$DATA_DIR/throttle_" . substr($ip, 0, 16);
    if (file_exists($tf) && time() - filemtime($tf) < THROTTLE_SEC) out(['error' => 'slow down'], 429);
    @touch($tf);

    $entry = ['name' => $name, 'time' => $time, 'b' => $b, 'seed' => $seed, 'v' => substr((string)($in['v'] ?? ''), 0, 10), 'at' => time()];
    $rank = 0;
    with_file("$DATA_DIR/rank_$d.json", function ($data) use ($entry, &$rank) {
        $data[] = $entry;
        usort($data, fn($a, $b) => [$a['time'], $a['b']] <=> [$b['time'], $b['b']]);
        $data = array_slice($data, 0, MAX_KEEP);
        $rank = 1 + count(array_filter($data, fn($r) => $r['seed'] === $entry['seed'] && $r['time'] < $entry['time']));
        return $data;
    }, true);
    out(['ok' => true, 'rank' => $rank]);
}

out(['error' => 'method'], 405);
