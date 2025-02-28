import { Webhook } from "simple-discord-webhooks";
import type { APIEmbed } from "discord-api-types/v10";

import { AccountClient, AccountNotLoggedInError } from "../account";
import { BASE_EMBED, LOGIN_RETRY_DELAY, MAX_RETRY, TIMEOUT } from "./constants";

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

class BotClient {
    private accountClient: AccountClient;
    private username: string;
    private password: string;
    private postman: Webhook;

    constructor(username: string, password: string, webhookUrl: string | URL) {
        this.username = username;
        this.password = password;

        this.postman = new Webhook(
            webhookUrl instanceof URL ? webhookUrl : new URL(webhookUrl),
        );
        this.accountClient = new AccountClient();
    }

    public static log(msg: string) {
        console.log(`${new Date().toISOString()}: ${msg}`);
    }

    public static err(err: unknown) {
        console.error(`${new Date().toISOString()}:`, err);
    }

    public async loginWithRetries() {
        let attempts = 0;

        while (attempts < MAX_RETRY) {
            try {
                await this.accountClient.login(this.username, this.password);

                BotClient.log("Login successful!");

                return;
            } catch (e) {
                BotClient.err(`Login attempt ${attempts + 1} failed: ${e}`);

                attempts++;

                if (attempts >= MAX_RETRY)
                    throw new Error("Maximum login attempts exceeded.");
            }

            await delay(LOGIN_RETRY_DELAY);
        }
    }

    public async run() {
        try {
            while (true) {
                const embed = structuredClone(BASE_EMBED);

                try {
                    let timeout = TIMEOUT;
                    const crates = await this.accountClient.getCrates();
                    const availableCrates = (
                        await this.accountClient.getAccountInfo()
                    ).crates;

                    for (const crate of availableCrates) {
                        const crateData = crates.filter(
                            (c) => c.name == crate.crateName,
                        )[0];
                        const nextClaimDate =
                            new Date(crate.lastClaimTime).getTime() +
                            crateData.every * 1000; // every is in seconds

                        if (Date.now() > nextClaimDate) {
                            const claim = await this.accountClient.claimCrate(
                                crateData.name,
                            );
                            timeout = crateData.every * 1000;

                            embed.fields!.push({
                                name: `Crate \`${crateData.name}\``,
                                value: `+${claim.earned} e-sous`,
                            });

                            BotClient.log(
                                `Opened '${crateData.name}' => +${claim.earned} e-sous`,
                            );
                        } else {
                            timeout = nextClaimDate - Date.now();
                        }
                    }

                    if (embed.fields!.length > 0) {
                        await this.postman.send("", [embed]);
                        BotClient.log("Embed sent successfully.");
                    } else {
                        BotClient.log("No crates claimed, nothing to send.");
                    }

                    BotClient.log(
                        `Waiting ${Math.floor(
                            timeout / 1000 / 3600,
                        )} hours until next claim..`,
                    );

                    await delay(timeout);
                } catch (e) {
                    if (e instanceof AccountNotLoggedInError) {
                        BotClient.err(
                            "Session expired, attempting to re-login...",
                        );

                        try {
                            await this.loginWithRetries();
                            BotClient.log(
                                "Re-login successful. Resuming fetch...",
                            );
                            continue;
                        } catch (reLoginError) {
                            BotClient.err(`Re-login failed: ${reLoginError}`);
                            break;
                        }
                    } else {
                        BotClient.err(e);

                        embed.title = "Bad news!";
                        embed.color = 0xed1c24;
                        embed.fields!.push({ name: "Error", value: `${e}` });

                        await this.postman.send("", [embed]);
                    }

                    await delay(TIMEOUT);
                }
            }
        } catch (e) {
            BotClient.err(`Critical failure: ${e}`);
            process.exit(1);
        }
    }
}

export default BotClient;
