import { AccountClient, AccountNotLoggedInError } from "../account";
import CrateClaimer from "./claimer";
import { ENV } from "./env";
import Logger from "./logger";
import Notifier from "./notifier";

class BotClient {
  private accountClient: AccountClient;
  private claimer: CrateClaimer;
  private notifier: Notifier;
  private running = true;

  constructor(webhookUrl?: string | URL, accountClient?: AccountClient) {
    this.accountClient = accountClient ?? new AccountClient();
    this.claimer = new CrateClaimer(this.accountClient);
    this.notifier = new Notifier(webhookUrl);

    const shutdown = () => {
      Logger.log("Shutting down...");
      this.running = false;
    };

    process.on("SIGINT", shutdown);
    process.on("SIGTERM", shutdown);
  }

  /**
   * Returns a promise that resolves after the given milliseconds.
   */
  private static delay(ms: number) {
    return new Promise((resolve) => setTimeout(resolve, ms));
  }

  /**
   * Attempts to log in with retries on failure.
   */
  private async loginWithRetries(username: string, password: string) {
    for (let attempt = 1; attempt <= ENV.LOGIN_RETRY_MAX; attempt++) {
      try {
        await this.accountClient.login(username, password);

        Logger.log("Login successful!");

        return;
      } catch (e) {
        Logger.err(`Login attempt ${attempt} failed: ${e}`);

        if (attempt < ENV.LOGIN_RETRY_MAX) await BotClient.delay(ENV.LOGIN_RETRY_DELAY);
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

    while (this.running) {
      let timeout = ENV.TIMEOUT;

      try {
        const { claimed, nextTimeout } = await this.claimer.claimAvailable();

        timeout = nextTimeout;

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

      await BotClient.delay(timeout);
    }

    Logger.log("Bot stopped.");
  }
}

export default BotClient;
