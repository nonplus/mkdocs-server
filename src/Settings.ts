import {EventEmitter} from "events";

import db from "./db/db";

const DEFAULT_SITE_TITLE = "MkDocs Server";

interface ISettings {
  siteTitle?: string;
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

  private constructor(private config: ISettings) {
  }

  get siteTitle() {
    return this.config.siteTitle || DEFAULT_SITE_TITLE;
  }

}
