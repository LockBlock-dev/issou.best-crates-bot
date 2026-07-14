import { AccountClient, AccountNotLoggedInError } from "../account";
import CrateClaimer from "./claimer";
import { ENV } from "./env";
import Logger from "./logger";
import Notifier from "./notifier";

class BotClient {
  private accountClient: AccountClient;
  private claimer: CrateClaimer;
  private notifier: Notifier;
  private abort = new AbortController();

  constructor(webhookUrl?: string | URL, accountClient?: AccountClient) {
    this.accountClient = accountClient ?? new AccountClient(ENV.COOKIE_FILE);
    this.claimer = new CrateClaimer(this.accountClient);
    this.notifier = new Notifier(webhookUrl);

    const shutdown = () => {
      if (this.abort.signal.aborted) return;
      Logger.log("Shutting down...");
      this.abort.abort();
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  /**
   * Returns a promise that resolves after the given milliseconds, or rejects if aborted.
   */
  private delay(ms: number) {
    return new Promise<void>((resolve, reject) => {
      const timer = setTimeout(resolve, ms);
      this.abort.signal.addEventListener("abort", () => {
        clearTimeout(timer);
        reject(this.abort.signal.reason);
      });
    });
  }

  /**
   * Attempts to log in with retries on failure.
   */
  private async loginWithRetries(username: string, password: string) {
    for (let attempt = 1; attempt <= ENV.LOGIN_RETRY_MAX; attempt++) {
      this.abort.signal.throwIfAborted();

      try {
        await this.accountClient.login(username, password);

        Logger.log("Login successful!");

        return;
      } catch (e) {
        if (this.abort.signal.aborted) throw e;

        Logger.err(`Login attempt ${attempt} failed: ${e}`);

        if (attempt < ENV.LOGIN_RETRY_MAX) await this.delay(ENV.LOGIN_RETRY_DELAY);
      }
    }

    throw new Error("Maximum login attempts exceeded.");
  }

  /**
   * Attempts to re-login after session expiry. Returns true on success.
   */
  private async handleSessionExpired(username: string, password: string) {
    try {
      await this.loginWithRetries(username, password);
      Logger.log("Re-login successful. Resuming fetch...");
      return true;
    } catch (reLoginError) {
      Logger.err(`Re-login failed: ${reLoginError}`);
      await this.notifier.sendError(`${reLoginError}`);
    }

    return false;
  }

  /**
   * Runs the bot's main loop, claiming crates and sending notifications.
   */
  public async run(username: string, password: string) {
    Logger.log(`Welcome ${username}!`);

    if (!this.notifier.available)
      Logger.warn("No webhook configured, notifications will be skipped.");

    await this.accountClient.loadCookies();

    try {
      while (true) {
        let timeout = ENV.TIMEOUT;

        try {
          const { claimed, nextTimeout } = await this.claimer.claimAvailable();

          timeout = nextTimeout < Infinity ? Math.max(ENV.TIMEOUT, nextTimeout) : ENV.TIMEOUT;

          if (claimed.length > 0) {
            Logger.log(`Claimed ${claimed.length} crate(s).`);
            await this.notifier.sendResults(claimed);
          } else {
            Logger.log("No crates claimed, nothing to send.");
          }
        } catch (e) {
          if (e instanceof AccountNotLoggedInError) {
            Logger.err("Session expired, attempting to re-login...");
            if (await this.handleSessionExpired(username, password)) continue;

            break;
          }

          Logger.err(e);
          await this.notifier.sendError(`${e}`);
        }

        const minutes = Math.floor(timeout / 1000 / 60);
        Logger.log(`Waiting ${minutes} minutes until next claim..`);

        await this.delay(timeout);
      }
    } catch {
      // aborted by shutdown signal
    }

    Logger.log("Bot stopped.");
  }
}

export default BotClient;
