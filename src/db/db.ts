import low = require("lowdb");
import FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data/db.json");
const db = new low(adapter);

// Set some defaults
db.defaults({ projects: [], config: {} })
  .write();

export default db;
