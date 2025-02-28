import * as cookie from "cookie";

import { HttpClient, HttpError } from "../http";
import { API_URL, USER_AGENT } from "./constants";
import {
    AccountCrateClaimError,
    AccountError,
    AccountNotLoggedInError,
} from "./errors";
import type { AccountInfo, ClaimedCrate, Crates } from "./types";

class AccountClient {
    private url: string;
    private http: HttpClient;
    private connectSid?: string;

    constructor() {
        this.url = API_URL;

        this.http = new HttpClient(this.url, {
            "User-Agent": USER_AGENT,
        });
    }

    public async login(username: string, password: string) {
        const resp = await this.http.post({
            path: "/auth/login",
            body: {
                username,
                password,
            },
        });

        const setCookie = resp.headers["set-cookie"];

        if (!setCookie)
            throw new AccountError("Could not get connect.sid cookie!");

        const maybeConnectSid = (
            Array.isArray(setCookie) ? setCookie : [setCookie]
        ).find((c) => c.startsWith("connect.sid"));

        if (!maybeConnectSid)
            throw new AccountError("Could not get connect.sid cookie!");

        const { "connect.sid": connectSid } = cookie.parse(maybeConnectSid);

        if (!connectSid)
            throw new AccountError("Could not get connect.sid cookie!");

        this.connectSid = connectSid;

        this.http.setHeader("Cookie", `connect.sid=${this.connectSid}`);

        return this.connectSid;
    }

    public async getAccountInfo() {
        if (!this.connectSid) throw new AccountNotLoggedInError();

        const resp = await this.http.get({
            path: "/auth/info",
        });

        if (!resp.ok)
            throw new AccountError(
                `Could not GET your account info: ${
                    new HttpError(resp).message
                }`,
            );

        const body = (await resp.json()) as AccountInfo;

        if (!body.isSignedIn) throw new AccountNotLoggedInError();

        return body;
    }

    public async getCrates() {
        if (!this.connectSid) throw new AccountNotLoggedInError();

        const resp = await this.http.get({
            path: "/crates",
        });

        if (!resp.ok) {
            if (resp.status === 401) throw new AccountNotLoggedInError();
            else
                throw new AccountError(
                    `Could not GET your crates: ${new HttpError(resp).message}`,
                );
        }

        return (await resp.json()) as Crates;
    }

    public async claimCrate(crateName: string) {
        if (!this.connectSid) throw new AccountNotLoggedInError();

        const resp = await this.http.post({
            path: "/crates/claim",
            body: {
                crate: crateName,
            },
        });

        if (!resp.ok) {
            if (resp.status === 401) throw new AccountNotLoggedInError();
            else if (resp.status === 403)
                throw new AccountCrateClaimError(crateName);
            else
                throw new AccountError(
                    `Could not claim the crate ${crateName}: ${
                        new HttpError(resp).message
                    }`,
                );
        }

        return (await resp.json()) as ClaimedCrate;
    }
}

export default AccountClient;
