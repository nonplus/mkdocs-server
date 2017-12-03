import low = require("lowdb");
import FileSync = require("lowdb/adapters/FileSync");

import {DataDir} from "../config";

const adapter = new FileSync(`${DataDir}/settings.json`);
const db = new low(adapter);

// Set some defaults
db.defaults({ settings: {} })
  .write();

export default db;
