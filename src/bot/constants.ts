import { type APIEmbed } from "discord-api-types/v10";

export const TIMEOUT = (parseInt(process.env.TIMEOUT!, 10) || 60 * 5) * 1000;

export const MAX_RETRY = parseInt(process.env.LOGIN_RETRY_MAX!, 10) || 3;

export const LOGIN_RETRY_DELAY =
    (parseInt(process.env.LOGIN_RETRY_DELAY!, 10) || 3) * 1000;

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
