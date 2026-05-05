<?php

declare(strict_types=1);

require __DIR__ . '/config.php';

const SAVE_VERSION = 1;
const MAX_SAVE_JSON_BYTES = 204800; // 200 KB save payload limit.
const VALID_FACINGS = ['down', 'left', 'right', 'up'];
const MAX_PARTY_SIZE = 12;
const MAX_CREATURE_MOVES = 4;
const MAX_CREATURE_LEVEL = 100;

function has_only_keys(array $value, array $allowedKeys): bool
{
    return count(array_diff(array_keys($value), $allowedKeys)) === 0;
}

function is_int_between(mixed $value, int $min, int $max): bool
{
    return is_int($value) && $value >= $min && $value <= $max;
}

function is_number_between(mixed $value, int|float $min, int|float $max): bool
{
    return (is_int($value) || is_float($value)) && $value >= $min && $value <= $max;
}

function is_valid_short_text(mixed $value, int $maxLength): bool
{
    return is_string($value) && trim($value) !== '' && strlen($value) <= $maxLength;
}

function validate_creature_save(mixed $creature): bool
{
    if (!is_array($creature)) return false;

    if (!has_only_keys($creature, [
        'species',
        'nickname',
        'role',
        'level',
        'xp',
        'maxHp',
        'hp',
        'moves',
        'captured'
    ])) {
        return false;
    }

    if (!is_valid_short_text($creature['species'] ?? null, 60)) return false;
    if (!is_valid_short_text($creature['nickname'] ?? null, 50)) return false;
    if (!is_valid_short_text($creature['role'] ?? null, 80)) return false;
    if (!is_number_between($creature['level'] ?? null, 1, MAX_CREATURE_LEVEL)) return false;
    if (!is_number_between($creature['xp'] ?? null, 0, 1000000)) return false;
    if (!is_number_between($creature['maxHp'] ?? null, 1, 10000)) return false;
    if (!is_number_between($creature['hp'] ?? null, 0, 10000)) return false;
    if (($creature['hp'] ?? 0) > ($creature['maxHp'] ?? 0)) return false;
    if (!is_bool($creature['captured'] ?? null)) return false;

    $moves = $creature['moves'] ?? null;
    if (!is_array($moves) || count($moves) === 0 || count($moves) > MAX_CREATURE_MOVES) return false;
    foreach ($moves as $move) {
        if (!is_valid_short_text($move, 60)) return false;
    }

    return true;
}

function validate_game_save(mixed $gameState): bool
{
    if (!is_array($gameState)) return false;

    if (!has_only_keys($gameState, ['saveVersion', 'world', 'player'])) return false;
    if (($gameState['saveVersion'] ?? null) !== SAVE_VERSION) return false;

    $world = $gameState['world'] ?? null;
    if (!is_array($world) || !has_only_keys($world, ['currentMapId'])) return false;
    if (!is_valid_short_text($world['currentMapId'] ?? null, 60)) return false;

    $player = $gameState['player'] ?? null;
    if (!is_array($player)) return false;
    if (!has_only_keys($player, [
        'x',
        'y',
        'facing',
        'potions',
        'orbs',
        'wins',
        'maxMp',
        'mp',
        'mpRechargeStepProgress',
        'activeIndex',
        'party'
    ])) {
        return false;
    }

    if (!is_int_between($player['x'] ?? null, 0, 500)) return false;
    if (!is_int_between($player['y'] ?? null, 0, 500)) return false;
    if (!in_array($player['facing'] ?? null, VALID_FACINGS, true)) return false;
    if (!is_number_between($player['potions'] ?? null, 0, 999)) return false;
    if (!is_number_between($player['orbs'] ?? null, 0, 999)) return false;
    if (!is_number_between($player['wins'] ?? null, 0, 1000000)) return false;
    if (!is_number_between($player['maxMp'] ?? null, 1, 999)) return false;
    if (!is_number_between($player['mp'] ?? null, 0, 999)) return false;
    if (($player['mp'] ?? 0) > ($player['maxMp'] ?? 0)) return false;
    if (!is_number_between($player['mpRechargeStepProgress'] ?? null, 0, 1000)) return false;

    $party = $player['party'] ?? null;
    if (!is_array($party) || count($party) === 0 || count($party) > MAX_PARTY_SIZE) return false;
    if (!is_int_between($player['activeIndex'] ?? null, 0, count($party) - 1)) return false;

    foreach ($party as $creature) {
        if (!validate_creature_save($creature)) return false;
    }

    return true;
}

$userId = require_login();
$pdo = get_pdo();

if ($_SERVER['REQUEST_METHOD'] === 'GET') {
    $statement = $pdo->prepare('SELECT save_version, save_json, updated_at FROM game_saves WHERE user_id = ?');
    $statement->execute([$userId]);
    $save = $statement->fetch();

    if (!$save) {
        json_response(['ok' => true, 'save' => null]);
    }

    json_response([
        'ok' => true,
        'save' => [
            'saveVersion' => (int) $save['save_version'],
            'gameState' => json_decode($save['save_json'], true),
            'updatedAt' => $save['updated_at'],
        ],
    ]);
}

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    header('Allow: GET, POST');
    json_response(['ok' => false, 'error' => 'Method not allowed.'], 405);
}

$data = read_json_body();
$saveVersion = $data['saveVersion'] ?? null;
$gameState = $data['gameState'] ?? null;

if ($saveVersion !== SAVE_VERSION) {
    json_response(['ok' => false, 'error' => 'Unsupported save version.'], 400);
}

if (!validate_game_save($gameState)) {
    json_response(['ok' => false, 'error' => 'Save data is not a valid Orb Bound save.'], 400);
}

$saveJson = json_encode($gameState, JSON_THROW_ON_ERROR);
if (strlen($saveJson) > MAX_SAVE_JSON_BYTES) {
    json_response(['ok' => false, 'error' => 'Save data is too large.'], 413);
}

$statement = $pdo->prepare(
    'INSERT INTO game_saves (user_id, save_version, save_json)
     VALUES (?, ?, ?)
     ON DUPLICATE KEY UPDATE
       save_version = VALUES(save_version),
       save_json = VALUES(save_json),
       updated_at = CURRENT_TIMESTAMP'
);
$statement->execute([$userId, $saveVersion, $saveJson]);

json_response(['ok' => true]);
