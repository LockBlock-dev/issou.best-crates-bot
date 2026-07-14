# issou.best crates bot

Automatically claim your daily crates on [account.issou.best](https://account.issou.best/) and get results posted to a Discord webhook.

## Setup

Create a `.env` file with the following variables:

```env
USERNAME=your_username
PASSWORD=your_password
DISCORD_WEBHOOK_URL=https://discord.com/api/webhooks/...
```

Optional variables:

| Variable            | Default | Description                                          |
| ------------------- | ------- | ---------------------------------------------------- |
| `TIMEOUT`           | `300`   | Minimum seconds between claim cycles                 |
| `LOGIN_RETRY_MAX`   | `3`     | Max login retry attempts                             |
| `LOGIN_RETRY_DELAY` | `3`     | Seconds between retries                              |
| `COOKIE_FILE`       |         | Path to the cookie persistence file                  |
| `TZ`                | `UTC`   | Timezone                                             |

## Run

### Node / Bun

```sh
bun install
bun run build
bun start
```

### Docker

```sh
docker compose up -d
```

### Docker with Gluetun VPN

Additional environment variables are required for VPN configuration:

| Variable                | Default                  | Description         |
| ----------------------- | ------------------------ | ------------------- |
| `PROTONVPN_PRIVATE_KEY` |                          | WireGuard key       |
| `VPN_SERVICE_PROVIDER`  | `protonvpn`              | VPN provider        |
| `VPN_TYPE`              | `wireguard`              | VPN protocol        |
| `SERVER_COUNTRIES`      | `Netherlands,Canada,...` | VPN server countries|
| `FREE_ONLY`             | `on`                     | Free servers only   |
| `UPDATER_PERIOD`        | `72h`                    | Server list refresh |

```sh
docker compose -f compose.gluetun.yaml up -d
```

## License

[AGPL-3.0-or-later](./LICENSE)
