import * as path from "path";

require("source-map-support").install();
import * as express from "express";
import * as bodyParser from "body-parser";
import adminRouter from "./views/admin/routes";
import db from "./db/db";
import Site from "./Site";

class App {
  public express;

  constructor() {
    this.express = express();
    this.configParsers();
    this.configViews();
    this.mountRoutes();
    this.configStaticSites();
  }

  private configParsers() {
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  private configViews() {
    this.express.set("views", "./src/views");
    this.express.set("view engine", "pug");
  }

  public configStaticSites() {
    Site.publishedSites()
      .forEach(site => {
        let siteDirectory = site.siteDirectory;
        console.log("Mapping", `/${site.name}`, "to", siteDirectory);
        this.express.use(`/${site.name}`, express.static(siteDirectory))
      });
  }

  private mountRoutes(): void {
    const router = express.Router();
    router.get("/", (req, res) => {
      res.render("home", {
        sites: Site.publishedSites()
      });
    });
    this.express.use("/", router);
    this.express.use("/\\$admin", adminRouter);
  }

}

export default new App();
