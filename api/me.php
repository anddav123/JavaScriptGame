<?php

declare(strict_types=1);

require __DIR__ . '/config.php';

if (!isset($_SESSION['user_id'], $_SESSION['username'])) {
    json_response(['ok' => true, 'user' => null]);
}

json_response([
    'ok' => true,
    'user' => [
        'id' => (int) $_SESSION['user_id'],
        'username' => $_SESSION['username'],
    ],
]);
