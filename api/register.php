<?php

declare(strict_types=1);

require __DIR__ . '/config.php';

$data = read_json_body();
$username = normalise_username($data['username'] ?? null);
$password = require_password($data['password'] ?? null);

$pdo = get_pdo();

$existing = $pdo->prepare('SELECT id FROM users WHERE username = ?');
$existing->execute([$username]);
if ($existing->fetch()) {
    json_response(['ok' => false, 'error' => 'That username is already taken.'], 409);
}

$passwordHash = password_hash($password, PASSWORD_DEFAULT);
$insert = $pdo->prepare('INSERT INTO users (username, password_hash) VALUES (?, ?)');
$insert->execute([$username, $passwordHash]);

$_SESSION['user_id'] = (int) $pdo->lastInsertId();
$_SESSION['username'] = $username;

json_response([
    'ok' => true,
    'user' => [
        'id' => $_SESSION['user_id'],
        'username' => $username,
    ],
]);
