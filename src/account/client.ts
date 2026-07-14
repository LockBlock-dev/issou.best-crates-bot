import { readFile, writeFile } from "node:fs/promises";

import { HttpClient, HttpCookieJar, type Cookie } from "http-lib";

import { API_URL, USER_AGENT } from "./constants";
import { AccountError, AccountNotLoggedInError } from "./errors";
import type { AccountInfo, APIResponse, ClaimedCrate, Crates } from "./types";

class AccountClient {
  private cookieJar: HttpCookieJar;
  private http: HttpClient;
  private connectSid?: string;
  /**
   * Creates an AccountClient with optional cookie persistence.
   */
  constructor(cookieFile?: string) {

    this.cookieJar = new HttpCookieJar(
      cookieFile
        ? {
            persistence: {
              async load() {
                try {
                  return JSON.parse(await readFile(cookieFile, "utf-8")) as Cookie[];
                } catch {
                  return [];
                }
              },
              async save(cookies) {
                await writeFile(cookieFile, JSON.stringify(cookies, null, 2));
              },
            },
          }
        : undefined,
    );

    this.http = new HttpClient(API_URL, {
      cookieJar: this.cookieJar,
      headers: {
        "User-Agent": USER_AGENT,
      },
    });
  }

  /**
   * Loads persisted cookies from disk.
   */
  public async loadCookies() {
    await this.cookieJar.load();
  }

  /**
   * Saves current cookies to disk.
   */
  public async saveCookies() {
    await this.cookieJar.save();
  }

  /**
   * Logs in a user with the given credentials.
   */
  public async login(username: string, password: string) {
    (
      await this.http.post({
        path: "auth/login",
        body: {
          username,
          password,
        },
      })
    ).assertOk();

    this.connectSid = this.cookieJar.getCookie("connect.sid");

    if (!this.connectSid) throw new AccountError("Could not get connect.sid cookie!");

    await this.saveCookies();

    return this.connectSid!;
  }

  /**
   * Retrieves account information for the currently logged-in user.
   */
  public async getAccountInfo() {
    if (!this.connectSid) throw new AccountNotLoggedInError();

    const body = await (
      await this.http.get({
        path: "auth/info",
      })
    )
      .assertOk()
      .tryJson<AccountInfo>();

    if (!body?.isSignedIn) throw new AccountNotLoggedInError();

    return body;
  }

  /**
   * Fetches the list of crates owned by the user.
   */
  public async getCrates() {
    if (!this.connectSid) throw new AccountNotLoggedInError();

    return await (
      await this.http.get({
        path: "crates",
      })
    )
      .assertOk()
      .json<Crates>();
  }

  /**
   * Claims a crate by name for the user.
   */
  public async claimCrate(crateName: string) {
    if (!this.connectSid) throw new AccountNotLoggedInError();

    return await (
      await this.http.post({
        path: "crates/claim",
        body: {
          crate: crateName,
        },
      })
    )
      .assertOk()
      .json<ClaimedCrate>();
  }

  /**
   * Sends credits from the user's account to a recipient.
   */
  public async sendCredits(amount: number, recipient: string) {
    if (!this.connectSid) throw new AccountNotLoggedInError();

    return await (
      await this.http.post({
        path: "credits/send",
        body: {
          credits: amount.toString(10),
          recipient,
        },
      })
    )
      .assertOk()
      .json<APIResponse>();
  }
}

export default AccountClient;
