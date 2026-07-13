# Changelog

All notable changes to this project will be documented in this file.

The format is based on [Keep a Changelog](https://keepachangelog.com/en/1.1.0/),
and this project adheres to [Semantic Versioning](https://semver.org/spec/v2.0.0.html).

## [2.3.0] - 2026-07-14

### Added

- `EnvVar` class with chainable validation helpers.
- `ENV` object with validated, typed environment variables.

### Changed

- Extracted crate claiming into `CrateClaimer`.
- Extracted notification into `Notifier`.
- `BotClient` constructor takes optional `AccountClient`.
- `BotClient.run()` and `loginWithRetries()` now accept credentials as arguments.

## [2.2.0] - 2026-07-14

### Added

- Custom webhook implementation replacing `simple-discord-webhooks` dependency.
- `Logger` class with timestamped, leveled logging (`[I]`, `[W]`, `[E]`).
- JSDoc comments for all methods and constants across the codebase.
- `format` and `lint` scripts using `oxfmt` and `oxlint`.
- `.dockerignore` file.
- Graceful shutdown on `SIGINT`/`SIGTERM`.
- Webhook send failure handling to prevent cascading errors.
- Timezone-aware logging via `TZ` environment variable.
- `compose.gluetun.yaml` for VPN usage alongside base `compose.yaml`.

### Changed

- Migrated project from Node.js to Bun.
- Migrated `compose.yaml` environment variables to use `${VAR:-DEFAULT}` syntax with parameterized VPN and timezone settings.
- Made `DISCORD_WEBHOOK_URL` optional.
- Extracted logging from `BotClient` into standalone `Logger` class.
- `AccountClient` is now an optional constructor parameter in `BotClient` (defaults to `new AccountClient()`).
- `BotClient.run()` and `loginWithRetries()` accept `username`/`password` as arguments.
- Unknown crates now log a warning instead of silently skipping.
- Replaced hourly wait log with minutes for better precision.

### Removed

- `simple-discord-webhooks` dependency.

## [2.1.0] - 2026-01-30

### Added

- `sendCredits` method to `AccountClient` for sending credits to other users.
- Docker Compose configuration with Gluetun VPN sidecar.
- Bot environment variables in `compose.yaml` (`TIMEOUT`, `LOGIN_RETRY_MAX`, `LOGIN_RETRY_DELAY`).
- README documentation.

### Changed

- Updated project dependencies.

## [2.0.0] - 2025-02-28

### Added

- Initial release.
- `AccountClient` for authentication, crate claiming, and account management.
- `BotClient` with automatic login retries and Discord webhook notifications.
- Dockerfile for containerized deployment.
- TypeScript configuration and project structure.
