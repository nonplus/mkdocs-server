import low = require("lowdb");
import FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data/settings.json");
const db = new low(adapter);

// Set some defaults
db.defaults({ settings: {} })
  .write();

export default db;
