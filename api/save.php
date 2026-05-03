<?php

declare(strict_types=1);

require __DIR__ . '/config.php';

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

if (!is_int($saveVersion)) {
    json_response(['ok' => false, 'error' => 'saveVersion must be an integer.'], 400);
}

if (!is_array($gameState)) {
    json_response(['ok' => false, 'error' => 'gameState must be an object.'], 400);
}

$saveJson = json_encode($gameState, JSON_THROW_ON_ERROR);
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
