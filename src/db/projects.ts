import low = require("lowdb");
import FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data/projects.json");
const db = new low(adapter);

// Set some defaults
db.defaults({projects: []})
  .write();

export default db;
