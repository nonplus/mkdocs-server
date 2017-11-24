require("source-map-support").install();
import * as express from "express";
var bodyParser = require("body-parser");
import adminRouter from "./views/admin/routes";
import db from "./db/db";

class App {
  public app;

  constructor() {
    this.app = express();
    this.configParsers();
    this.configViews();
    this.mountRoutes();
  }

  private configParsers() {
    this.app.use(bodyParser.urlencoded({ extended: false }));
  }

  private configViews() {
    this.app.set("views", "./src/views");
    this.app.set("view engine", "pug");
  }

  private mountRoutes(): void {
    const router = express.Router();
    router.get("/", (req, res) => {
      res.render("home", {
        sites: db.get("sites").value()
      });
    });
    this.app.use("/", router);
    this.app.use("/\\$admin", adminRouter);
  }

}

export default new App().app;
