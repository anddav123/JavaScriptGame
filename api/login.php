<?php

declare(strict_types=1);

require __DIR__ . '/config.php';

$data = read_json_body();
$username = normalise_username($data['username'] ?? null);
$password = require_password($data['password'] ?? null);

$pdo = get_pdo();
$statement = $pdo->prepare('SELECT id, username, password_hash FROM users WHERE username = ?');
$statement->execute([$username]);
$user = $statement->fetch();

if (!$user || !password_verify($password, $user['password_hash'])) {
    json_response(['ok' => false, 'error' => 'Invalid username or password.'], 401);
}

session_regenerate_id(true);
$_SESSION['user_id'] = (int) $user['id'];
$_SESSION['username'] = $user['username'];

json_response([
    'ok' => true,
    'user' => [
        'id' => $_SESSION['user_id'],
        'username' => $_SESSION['username'],
    ],
]);
