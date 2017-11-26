import db from "./db/db";

const DEFAULT_SITE_TITLE = "MkDocs Server";

interface ISettings {
  siteTitle?: string;
}

export default class Settings {

  public static get(): Settings {
    return new Settings(db.get("settings").value());
  }

  public static update(settings: Partial<ISettings>) {
    db.get("settings")
      .assign(settings)
      .write();
  }

  private constructor(private config: ISettings) {
  }

  get siteTitle() {
    return this.config.siteTitle || DEFAULT_SITE_TITLE;
  }

}
