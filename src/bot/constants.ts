import type { APIEmbed } from "discord-api-types/v10";

/**
 * The base embed template used for Discord messages.
 */
export const BASE_EMBED: APIEmbed = {
  title: "issou.best daily crates",
  thumbnail: {
    url: "https://dl.issou.best/acc/assets/chest-1.webp",
  },
  fields: [],
  footer: {
    text: "issou.best daily crates bot © LockBlock-dev",
  },
};
