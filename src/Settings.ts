import {EventEmitter} from "events";

import db from "./db/db";

const DEFAULT_SITE_TITLE = "MkDocs Server";

interface ISettings {
  siteTitle?: string;
  sessionSecret?: string;
  auth?: any;
}

interface IAuthGoogle {
  clientID: string;
  clientSecret: string;
  hostedDomain: string;
}

export enum SettingEvent {
  updated = "updated"
}

export default class Settings {

  public static readonly events = new EventEmitter();

  public static get(): Settings {
    return new Settings(db.get("settings").value());
  }

  public static update(settings: Partial<ISettings>) {
    db.get("settings")
      .assign(settings)
      .write();
    Settings.events.emit(SettingEvent.updated, settings);
  }

  public static setAuth(method: "google", value: IAuthGoogle);
  public static setAuth(method: string, value: any) {
    db.get("settings")
      .assign({
        auth: {[method]: value}
      })
      .write();
  }

  private constructor(private config: ISettings) {
  }

  get siteTitle() {
    return this.config.siteTitle || DEFAULT_SITE_TITLE;
  }

  get auth() {
    return this.config.auth || (this.config.auth = {});
  }

  get sessionSecret() {
    return this.config.sessionSecret;
  }

}
