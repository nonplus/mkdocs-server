import * as _ from "lodash";
import db from "./db/users";

interface UserConfig {
  provider: string;
  id: string;
  email: string;
}

export default class User implements UserConfig {

  public static resolve(id: string): User {
    const config: UserConfig = db
      .get("users")
      .find({id})
      .value<UserConfig>();
    if (config) {
      return new User(config);
    } else {
      return null;
    }
  }

  public static add(user: Partial<UserConfig>) {
    db
      .get("users")
      .push(user)
      .write();
  }

  public id: string;
  public email: string;
  public provider: string;

  constructor(config: UserConfig) {
    this.id = config.id;
    this.email = config.email;
    this.provider = config.provider;
  }

  public update(options: Partial<UserConfig>) {
    db.get("users").find({id: this.id})
      .assign(options)
      .write();
    _.extend(this, options);
  }

}
