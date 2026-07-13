import { Webhook } from "../webhook";
import { BASE_EMBED } from "./constants";
import Logger from "./logger";
import type { ClaimedEntry } from "./types";

class Notifier {
  private postman?: Webhook;

  constructor(webhookUrl?: string | URL) {
    if (webhookUrl) this.postman = new Webhook(webhookUrl);
  }

  /**
   * Whether a webhook is configured.
   */
  public get available() {
    return !!this.postman;
  }

  /**
   * Sends a success embed with claimed crates.
   */
  async sendResults(claimed: Array<ClaimedEntry>) {
    if (!this.postman || claimed.length === 0) return;

    const embed = structuredClone(BASE_EMBED);

    for (const crate of claimed)
      embed.fields!.push({
        name: `Crate \`${crate.name}\``,
        value: `+${crate.earned} e-sous`,
      });

    try {
      await this.postman.send("", [embed]);
      Logger.log("Embed sent successfully.");
    } catch (e) {
      Logger.err(`Failed to send webhook: ${e}`);
    }
  }

  /**
   * Sends an error embed to the webhook.
   */
  async sendError(msg: string) {
    if (!this.postman) return;

    const embed = structuredClone(BASE_EMBED);

    try {
      embed.title = "Bad news!";
      embed.color = 0xed1c24;
      embed.fields!.push({ name: "Error", value: msg });
      await this.postman.send("", [embed]);
    } catch (e) {
      Logger.err(`Failed to send error webhook: ${e}`);
    }
  }
}

export default Notifier;
