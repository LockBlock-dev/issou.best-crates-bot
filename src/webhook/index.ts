import type { APIEmbed } from "discord-api-types/v10";
import { HttpClient } from "http-lib";

export class Webhook {
  private url: string | URL;

  constructor(url: string | URL) {
    this.url = url;
  }

  /**
   * Sends a message via the webhook.
   */
  async send(content: string, embeds: Array<APIEmbed> = []) {
    (
      await HttpClient.post({
        url: this.url,
        query: new URLSearchParams({ wait: "true" }),
        body: { content, embeds },
      })
    ).assertOk();
  }
}
