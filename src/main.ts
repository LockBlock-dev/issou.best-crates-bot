import "dotenv/config";
import { BotClient } from "./bot";

const main = async () => {
  await new BotClient(process.env.DISCORD_WEBHOOK_URL).run(
    process.env.USERNAME!,
    process.env.PASSWORD!,
  );
};

main();
