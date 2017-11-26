import sms = require("source-map-support");

sms.install();

import * as bodyParser from "body-parser";
import * as express from "express";
import * as breadcrumbs from "express-breadcrumbs";
import * as _ from "lodash";

import Project from "./Project";
import Settings from "./Settings";
import configRouter from "./views/config";

declare global {
  namespace Express {
    interface Request {
      breadcrumbs(name: string, url: string): Array<{ name: string; url: string; }>;
    }
  }
}

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
    this.express.use(bodyParser.urlencoded({extended: false}));
  }

  private configViews() {
    this.express.set("views", "./src/views");
    this.express.set("view engine", "pug");
  }

  private mountRoutes(): void {
    const router = express.Router();
    router.use(breadcrumbs.init());
    router.use(breadcrumbs.setHome({
      name: Settings.get().siteTitle,
      url: "/"
    }));
    router.get("/", (req, res) => {
      res.render("home", {
        siteTitle: Settings.get().siteTitle,
        projects: _.sortBy(Project.publishedProjects(), (project) => (project.title || "").toLowerCase())
      });
    });
    this.express.use("/", router);
    this.express.use("/\\$config", configRouter);
  }

}

export default new App();
