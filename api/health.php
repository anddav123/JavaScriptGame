<?php

declare(strict_types=1);

require __DIR__ . '/config.php';

try {
    get_pdo()->query('SELECT 1');
    json_response(['ok' => true, 'database' => 'connected']);
} catch (Throwable $error) {
    json_response(['ok' => false, 'database' => 'unavailable'], 503);
}
