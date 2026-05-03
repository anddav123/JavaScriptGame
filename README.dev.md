# Local Development

This project can run as a static browser game, or with the PHP/MySQL backend for account-based saves.

## PHP/MySQL backend

Requirements:

- Docker Desktop or another Docker Compose compatible runtime

Start the local stack:

```bash
docker compose up -d --build
```

Local URLs:

- Game: <http://localhost:8080>
- API health check: <http://localhost:8080/api/health.php>
- phpMyAdmin: <http://localhost:8081>

Database connection details for local development:

- Host from containers: `mysql`
- Host from the Mac: `127.0.0.1:3307`
- Database: `orb_bound`
- User: `orb_bound_user`
- Password: `orb_bound_password`

Stop the stack:

```bash
docker compose down
```

Reset the database completely:

```bash
docker compose down -v
docker compose up -d
```

## API endpoints

All endpoints return JSON.

- `GET /api/health.php`
- `GET /api/me.php`
- `POST /api/register.php` with `{ "username": "player1", "password": "password123" }`
- `POST /api/login.php` with `{ "username": "player1", "password": "password123" }`
- `POST /api/logout.php`
- `GET /api/save.php`
- `POST /api/save.php` with `{ "saveVersion": 1, "gameState": { ... } }`

Passwords are stored using PHP `password_hash()`.

## Frontend save flow

When running through the PHP/Apache container:

- `Start Adventure` prompts for a new username/password, registers the player, then starts the intro.
- `Load Adventure` prompts for username/password, logs in, and loads that player's MySQL save.
- In-game `Save Game` stores the current state against the logged-in player.
- `Export Save` and `Import Save` remain available as JSON backup options.

If you run the game with a plain static server, account-based saves will not work because the PHP endpoints are not executed. The frontend detects this and switches to static/local mode:

- `Start Local Adventure` starts without account creation
- `Import JSON Save` remains available from the title screen
- in-game `Save Game` falls back to JSON export
- database load shows a clear unavailable message

Use `docker compose up -d --build` for database-backed saves.
