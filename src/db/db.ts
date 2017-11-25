const low = require('lowdb');
const FileSync = require('lowdb/adapters/FileSync');

const adapter = new FileSync('db.json');
const db = new low(adapter);

// Set some defaults
db.defaults({ sites: [], config: {} })
  .write();

export default db;
