import type { AccountClient } from "../account";
import { ENV } from "./env";
import Logger from "./logger";
import type { ClaimedEntry, ClaimResult } from "./types";

class CrateClaimer {
  private accountClient: AccountClient;

  constructor(accountClient: AccountClient) {
    this.accountClient = accountClient;
  }

  /**
   * Checks all available crates and claims those that are ready.
   */
  async claimAvailable(): Promise<ClaimResult> {
    const crates = await this.accountClient.getCrates();
    const availableCrates = (await this.accountClient.getAccountInfo()).crates;

    const claimed: Array<ClaimedEntry> = [];
    let nextTimeout = ENV.TIMEOUT;

    for (const crate of availableCrates) {
      const crateData = crates.find((c) => c.name === crate.crateName);

      if (!crateData) {
        Logger.warn(`Crate '${crate.crateName}' not found, skipping.`);
        continue;
      }

      const nextClaimDate = new Date(crate.lastClaimTime).getTime() + crateData.every * 1000; // every is in seconds

      if (Date.now() > nextClaimDate) {
        const result = await this.accountClient.claimCrate(crateData.name);

        claimed.push({ name: crateData.name, earned: result.earned });
        nextTimeout = Math.min(nextTimeout, crateData.every * 1000);

        Logger.log(`Opened '${crateData.name}' => +${result.earned} e-sous`);
      } else {
        nextTimeout = Math.min(nextTimeout, nextClaimDate - Date.now());
      }
    }

    return { claimed, nextTimeout };
  }
}

export default CrateClaimer;
