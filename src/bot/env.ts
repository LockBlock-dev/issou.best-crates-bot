class EnvVar {
  /**
   * Creates a new environment variable accessor.
   */
  constructor(
    private name: string,
    private value: string | undefined,
  ) {}

  /**
   * Returns the value or throws if not set.
   */
  required() {
    if (!this.value) throw new Error(`Missing required environment variable: ${this.name}`);

    return this.value;
  }

  /**
   * Returns the value parsed as an integer, or the fallback if not set.
   */
  optionalInt(fallback: number) {
    if (!this.value) return fallback;

    const parsed = parseInt(this.value, 10);

    if (isNaN(parsed)) throw new Error(`Invalid integer for ${this.name}: ${this.value}`);

    return parsed;
  }

  /**
   * Returns the value as a validated URL, or undefined if not set.
   */
  optionalUrl() {
    if (!this.value) return undefined;

    try {
      new URL(this.value);
    } catch {
      throw new Error(`Invalid URL for ${this.name}: ${this.value}`);
    }

    return this.value;
  }

  /**
   * Returns the value as a validated timezone, or the fallback if not set.
   */
  optionalTimezone(fallback: string) {
    const tz = this.value ?? fallback;

    try {
      Intl.DateTimeFormat(undefined, { timeZone: tz });
    } catch {
      throw new Error(`Invalid timezone for ${this.name}: ${tz}`);
    }

    return tz;
  }

  /**
   * Returns the value, or the fallback if not set.
   */
  optionalString(fallback: string) {
    return this.value ?? fallback;
  }
}

/**
 * Creates an EnvVar accessor for the given environment variable name.
 */
function env(name: string) {
  return new EnvVar(name, process.env[name]);
}

export const ENV = {
  /** The account username. */
  USERNAME: env("USERNAME").required(),
  /** The account password. */
  PASSWORD: env("PASSWORD").required(),
  /** Discord webhook URL for notifications. */
  DISCORD_WEBHOOK_URL: env("DISCORD_WEBHOOK_URL").optionalUrl(),
  /** Timezone used for timestamps. */
  TZ: env("TZ").optionalTimezone("UTC"),
  /** Timeout in milliseconds between claim cycles. */
  TIMEOUT: env("TIMEOUT").optionalInt(300) * 1000,
  /** Maximum number of login retry attempts. */
  LOGIN_RETRY_MAX: env("LOGIN_RETRY_MAX").optionalInt(3),
  /** Delay in milliseconds between login retry attempts. */
  LOGIN_RETRY_DELAY: env("LOGIN_RETRY_DELAY").optionalInt(3) * 1000,
  /** Path to the cookie persistence file. */
  COOKIE_FILE: process.env.COOKIE_FILE,
} as const;
