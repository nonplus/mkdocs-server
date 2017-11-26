import low = require("lowdb");
import FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data/db.json");
const db = new low(adapter);

// Set some defaults
db.defaults({ projects: [], settings: {} })
  .write();

export default db;
