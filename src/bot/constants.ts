import { type APIEmbed } from "discord-api-types/v10";

/**
 * The timeout in milliseconds before the bot restarts its cycle.
 */
export const TIMEOUT = (parseInt(process.env.TIMEOUT!, 10) || 60 * 5) * 1000;

/**
 * The maximum number of login retry attempts.
 */
export const MAX_RETRY = parseInt(process.env.LOGIN_RETRY_MAX!, 10) || 3;

/**
 * The delay in milliseconds between login retry attempts.
 */
export const LOGIN_RETRY_DELAY = (parseInt(process.env.LOGIN_RETRY_DELAY!, 10) || 3) * 1000;

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
