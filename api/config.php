<?php

declare(strict_types=1);

session_start([
    'cookie_httponly' => true,
    'cookie_samesite' => 'Lax',
]);

header('Content-Type: application/json');

function json_response(array $payload, int $statusCode = 200): void
{
    http_response_code($statusCode);
    echo json_encode($payload, JSON_PRETTY_PRINT);
    exit;
}

function read_json_body(): array
{
    $body = file_get_contents('php://input');
    if ($body === false || trim($body) === '') {
        return [];
    }

    $data = json_decode($body, true);
    if (!is_array($data)) {
        json_response(['ok' => false, 'error' => 'Request body must be valid JSON.'], 400);
    }

    return $data;
}

function get_pdo(): PDO
{
    $host = getenv('DB_HOST') ?: '127.0.0.1';
    $name = getenv('DB_NAME') ?: 'orb_bound';
    $user = getenv('DB_USER') ?: 'orb_bound_user';
    $pass = getenv('DB_PASS') ?: 'orb_bound_password';
    $dsn = "mysql:host={$host};dbname={$name};charset=utf8mb4";

    return new PDO($dsn, $user, $pass, [
        PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
        PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC,
        PDO::ATTR_EMULATE_PREPARES => false,
    ]);
}

function require_login(): int
{
    if (!isset($_SESSION['user_id']) || !is_int($_SESSION['user_id'])) {
        json_response(['ok' => false, 'error' => 'You must be logged in.'], 401);
    }

    return $_SESSION['user_id'];
}

function normalise_username(mixed $username): string
{
    if (!is_string($username)) {
        json_response(['ok' => false, 'error' => 'Username is required.'], 400);
    }

    $username = trim($username);
    if (!preg_match('/^[A-Za-z0-9_]{3,50}$/', $username)) {
        json_response([
            'ok' => false,
            'error' => 'Username must be 3-50 characters and use only letters, numbers, and underscores.'
        ], 400);
    }

    return $username;
}

function require_password(mixed $password): string
{
    if (!is_string($password) || strlen($password) < 8) {
        json_response(['ok' => false, 'error' => 'Password must be at least 8 characters.'], 400);
    }

    return $password;
}
