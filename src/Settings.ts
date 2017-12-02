import {EventEmitter} from "events";
import * as _ from "lodash";
import * as shortid from "shortid";

import db from "./db/settings";
import {IAuthGoogle} from "./auth/google";

const DEFAULT_SITE_TITLE = "MkDocs Server";

interface ISettings {
  siteTitle?: string;
  sessionSecret?: string;
  sshPassPhrase?: string;
  auth?: {
    google?: IAuthGoogle
  };
  admins?: string[];
}

export enum SettingEvent {
  updated = "updated",
  authChanged = "auth-changed"
}

export default class Settings {

  public static readonly events = new EventEmitter();

  public static initialize() {
    Settings.usesAuth = _.get(Settings.get(), "auth.google");
  }

  public static get(): Settings {
    return new Settings(db.get("settings").value());
  }

  public static canAdmin(email: string) {
    const admins = Settings.get().admins;
    return _.isEmpty(admins) || _.includes(admins, email);
  }

  public static update(settings: Partial<ISettings>) {
    settings = _.extend({}, settings);

    if (settings.admins) {
      settings.admins = _.chain(settings.admins)
        .map(_.trim)
        .map((email: string) => email.toLowerCase())
        .filter((email: string) => Boolean(email))
        .uniq()
        .value() as any;
    }

    const dbSettings = db.get("settings")
      .assign(settings);
    Settings.usesAuth = _.get(dbSettings.value(), "auth.google");
    dbSettings
      .write();
    Settings.events.emit(SettingEvent.updated, settings);
  }

  public static get usesAuthentication(): boolean {
    return Settings.usesAuth;
  }

  public static setAuth(method: "google", value: IAuthGoogle);
  public static setAuth(method: string, value: any) {
    db.get("settings")
      .assign({
        auth: {[method]: value}
      })
      .write();
    Settings.usesAuth = true;
    Settings.events.emit(SettingEvent.authChanged);
  }

  private static usesAuth = false;

  private constructor(private config: ISettings) {
  }

  get siteTitle() {
    return this.config.siteTitle || DEFAULT_SITE_TITLE;
  }

  get auth() {
    return this.config.auth || (this.config.auth = {});
  }

  get sessionSecret(): string {
    let sessionSecret = this.config.sessionSecret;
    if (!sessionSecret) {
      this.config.sessionSecret = sessionSecret = shortid();
      Settings.update({sessionSecret});
    }
    return sessionSecret;
  }

  get sshPassPhrase(): string {
    let sshPassPhrase = this.config.sshPassPhrase;
    if (!sshPassPhrase) {
      this.config.sshPassPhrase = sshPassPhrase = `${shortid()}${shortid()}${shortid()}`;
      Settings.update({sshPassPhrase});
    }
    return sshPassPhrase;
  }

  get admins(): string[] {
    return this.config.admins || [];
  }

}

Settings.initialize();
