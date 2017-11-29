import low = require("lowdb");
import FileSync = require("lowdb/adapters/FileSync");

const adapter = new FileSync("data/users.json");
const db = new low(adapter);

// Set some defaults
db.defaults({users: []})
  .write();

export default db;
