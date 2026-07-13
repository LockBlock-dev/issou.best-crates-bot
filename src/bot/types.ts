export interface ClaimedEntry {
  name: string;
  earned: number;
}

export interface ClaimResult {
  claimed: Array<ClaimedEntry>;
  nextTimeout: number;
}
