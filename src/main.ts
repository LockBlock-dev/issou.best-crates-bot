import "dotenv/config";
import { BotClient, ENV, Logger } from "./bot";

const main = async () => {
  try {
    await new BotClient(ENV.DISCORD_WEBHOOK_URL).run(ENV.USERNAME, ENV.PASSWORD);
  } catch (e) {
    Logger.err(`Critical failure: ${e}`);
    process.exitCode = 1;
  }
};

await main();
