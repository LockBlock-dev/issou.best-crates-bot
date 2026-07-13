import { AccountClient, AccountNotLoggedInError } from "../account";
import { Webhook } from "../webhook";
import { BASE_EMBED, LOGIN_RETRY_DELAY, MAX_RETRY, TIMEOUT } from "./constants";
import Logger from "./logger";

class BotClient {
  private accountClient: AccountClient;
  private postman?: Webhook;
  private running = true;

  constructor(webhookUrl?: string | URL, accountClient?: AccountClient) {
    this.accountClient = accountClient ?? new AccountClient();

    if (webhookUrl) this.postman = new Webhook(webhookUrl);

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
   * Sends an error embed to the webhook if configured.
   */
  private async sendErrorEmbed(
    embed: ReturnType<typeof structuredClone<typeof BASE_EMBED>>,
    msg: string,
  ) {
    if (!this.postman) return;

    try {
      embed.title = "Bad news!";
      embed.color = 0xed1c24;
      embed.fields!.push({ name: "Error", value: msg });
      await this.postman.send("", [embed]);
    } catch (e) {
      Logger.err(`Failed to send error webhook: ${e}`);
    }
  }

  /**
   * Attempts to log in with retries on failure.
   */
  public async loginWithRetries(username: string, password: string) {
    for (let attempt = 1; attempt <= MAX_RETRY; attempt++) {
      try {
        await this.accountClient.login(username, password);

        Logger.log("Login successful!");

        return;
      } catch (e) {
        Logger.err(`Login attempt ${attempt} failed: ${e}`);

        if (attempt < MAX_RETRY) await BotClient.delay(LOGIN_RETRY_DELAY);
      }
    }

    throw new Error("Maximum login attempts exceeded.");
  }

  /**
   * Runs the bot's main loop, claiming crates and sending notifications.
   */
  public async run(username: string, password: string) {
    Logger.log(`Welcome ${username}!`);

    if (!this.postman) Logger.warn("No webhook configured, notifications will be skipped.");

    try {
      while (this.running) {
        const embed = structuredClone(BASE_EMBED);
        let timeout = TIMEOUT;

        try {
          const crates = await this.accountClient.getCrates();
          const availableCrates = (await this.accountClient.getAccountInfo()).crates;

          for (const crate of availableCrates) {
            const crateData = crates.find((c) => c.name === crate.crateName);

            if (!crateData) {
              Logger.warn(`Crate '${crate.crateName}' not found, skipping.`);
              continue;
            }

            const nextClaimDate = new Date(crate.lastClaimTime).getTime() + crateData.every * 1000; // every is in seconds

            if (Date.now() > nextClaimDate) {
              const claim = await this.accountClient.claimCrate(crateData.name);
              timeout = crateData.every * 1000;

              embed.fields!.push({
                name: `Crate \`${crateData.name}\``,
                value: `+${claim.earned} e-sous`,
              });

              Logger.log(`Opened '${crateData.name}' => +${claim.earned} e-sous`);
            } else {
              timeout = nextClaimDate - Date.now();
            }
          }

          if (embed.fields!.length > 0) {
            Logger.log(`Claimed ${embed.fields!.length} crate(s).`);

            if (this.postman) {
              try {
                await this.postman.send("", [embed]);
                Logger.log("Embed sent successfully.");
              } catch (e) {
                Logger.err(`Failed to send webhook: ${e}`);
              }
            }
          } else {
            Logger.log("No crates claimed, nothing to send.");
          }

          const minutes = Math.floor(timeout / 1000 / 60);
          Logger.log(`Waiting ${minutes} minutes until next claim..`);

          await BotClient.delay(timeout);
        } catch (e) {
          if (e instanceof AccountNotLoggedInError) {
            Logger.err("Session expired, attempting to re-login...");

            try {
              await this.loginWithRetries(username, password);
              Logger.log("Re-login successful. Resuming fetch...");
              continue;
            } catch (reLoginError) {
              Logger.err(`Re-login failed: ${reLoginError}`);
              await this.sendErrorEmbed(embed, `${reLoginError}`);
              break;
            }
          } else {
            Logger.err(e);
            await this.sendErrorEmbed(embed, `${e}`);
          }

          await BotClient.delay(timeout);
        }
      }
    } catch (e) {
      Logger.err(`Critical failure: ${e}`);
      process.exit(1);
    }

    Logger.log("Bot stopped.");
  }
}

export default BotClient;
