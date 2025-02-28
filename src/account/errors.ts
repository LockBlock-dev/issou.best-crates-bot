export class AccountError extends Error {
    constructor(message?: string) {
        super(message);

        this.name = "AccountError";
    }
}

export class AccountNotLoggedInError extends Error {
    constructor() {
        super();

        this.name = "AccountNotLoggedInError";
    }
}

export class AccountCrateClaimError extends Error {
    constructor(crateName: string) {
        super(`The crate ${crateName} is invalid/was already claimed!`);

        this.name = "AccountCrateClaimError";
    }
}
