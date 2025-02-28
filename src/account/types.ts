export enum TransactionType {
    CLAIM = "CLAIM",
    PURCHASE = "PURCHASE",
    TRANSFER_SENT = "TRANSFER_SENT",
    TRANSFER_RECEIVED = "TRANSFER_RECEIVED",
    YUNA_GAMBLE_WON = "YUNA_GAMBLE_WON",
    YUNA_GAMBLE_LOST = "YUNA_GAMBLE_LOST",
    CODE_CREDITS = "CODE_CREDITS",
}

export enum CurrencyType {
    CREDITS = "CREDITS",
}

export enum DonatorLevel {
    NONE,
    ONE,
    TWO,
    THREE,
    FOUR,
}

export interface InventoryItem {
    itemName: string;
    count: number;
}

export interface AccountInfoCrate {
    crateName: string;
    lastClaimTime: string;
    totalClaimed: number;
    totalEarned: number;
}

export interface Transaction {
    transactionId: number;
    date: string;
    type: TransactionType;
    purchasedItem: string;
    purchasedItemFullName: string;
    currency: CurrencyType;
    spent: number;
    received: number;
    receiverUsername: string;
    senderUsername: string;
}

interface BaseAccountInfo<signedIn = false> {
    isSignedIn: signedIn;
}

type NotSignedInAccountInfo = BaseAccountInfo;

export interface SignedInAccountInfo extends BaseAccountInfo<true> {
    userId: number;
    email: string;
    username: string;
    currentUsername: string;
    usernameSource: string;
    avatarUrl: string;
    credits: number;
    discordLinked: boolean;
    osuLinked: boolean;
    hasIbAccount: boolean;
    isPartner: boolean;
    ordr: Record<string, unknown>;
    inventory: Array<InventoryItem>;
    crates: Array<AccountInfoCrate>;
    transactionHistory: Array<Transaction>;
    customization: Record<string, string>;
    receipts: Array<unknown>;
    donatorLevel: DonatorLevel;
}

export type AccountInfo = SignedInAccountInfo | NotSignedInAccountInfo;

interface Crate {
    crateId: number;
    name: string;
    fullName: string;
    description: string;
    every: number;
    visual: string;
    restrictToDonatorLevel: DonatorLevel;
}

export type Crates = Array<Crate>;

export interface ClaimedCrate {
    earned: number;
}
