import low = require("lowdb");
import FileSync = require("lowdb/adapters/FileSync");

import {DataDir} from "../config";

const adapter = new FileSync(`${DataDir}/users.json`);
const db = new low(adapter);

// Set some defaults
db.defaults({users: []})
  .write();

export default db;
