export default class Logger {
  /**
   * Returns a formatted timestamp using the configured timezone.
   */
  private static timestamp() {
    return new Date().toLocaleString("sv-SE", { timeZone: process.env.TZ });
  }

  /**
   * Logs a message with a timestamp.
   */
  public static log(msg: string) {
    console.log(`${Logger.timestamp()}: [I] ${msg}`);
  }

  /**
   * Logs an error with a timestamp.
   */
  public static err(err: unknown) {
    console.error(`${Logger.timestamp()}: [E]`, err);
  }

  /**
   * Logs a warning with a timestamp.
   */
  public static warn(msg: string) {
    console.warn(`${Logger.timestamp()}: [W] ${msg}`);
  }
}
