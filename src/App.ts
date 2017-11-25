import sms = require("source-map-support");
sms.install();

import * as bodyParser from "body-parser";
import * as express from "express";
import * as _ from "lodash";
import db from "./db/db";
import Project from "./Project";
import adminRouter from "./views/admin/routes";

class App {
  public express;

  constructor() {
    this.express = express();
    this.configParsers();
    this.configViews();
    this.mountRoutes();
    this.configStaticSites();
  }

  public configStaticSites() {
    Project.publishedProjects()
      .forEach((project) => {
        const siteDirectory = project.siteDirectory;
        console.log("Mapping", `/${project.id}`, "to", siteDirectory);
        this.express.use(`/${project.id}`, express.static(siteDirectory));
      });
  }

  private configParsers() {
    this.express.use(bodyParser.urlencoded({ extended: false }));
  }

  private configViews() {
    this.express.set("views", "./src/views");
    this.express.set("view engine", "pug");
  }

  private mountRoutes(): void {
    const router = express.Router();
    router.get("/", (req, res) => {
      res.render("home", {
        projects: _.sortBy(Project.publishedProjects(), (project) => (project.title || "").toLowerCase())
      });
    });
    this.express.use("/", router);
    this.express.use("/\\$admin", adminRouter);
  }

}

export default new App();
