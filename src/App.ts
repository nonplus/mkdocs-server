import sms = require("source-map-support");

sms.install();

import * as bodyParser from "body-parser";
import * as express from "express";
import * as breadcrumbs from "express-breadcrumbs";
import * as _ from "lodash";

import Project, {ProjectEvent} from "./Project";
import Settings, {SettingEvent} from "./Settings";
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
  private router;

  constructor() {
    Settings.events.on(SettingEvent.updated, () => {
      this.refreshSiteTitle();
    });

    Project.events.on(ProjectEvent.docsPublished, () => {
      this.configStaticSites();
    });

    this.express = express();
    this.configParsers();
    this.configViews();
    this.mountRoutes();
    this.refreshSiteTitle();
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
    const router = this.router = express.Router();
    router.use(breadcrumbs.init());
    router.get("/", (req, res) => {
      res.render("home", {
        siteTitle: Settings.get().siteTitle,
        projects: _.sortBy(Project.publishedProjects(), (project) => (project.title || "").toLowerCase())
      });
    });
    this.express.use("/", router);
    this.express.use("/\\$config", configRouter);
  }

  private refreshSiteTitle() {
    this.router.use(breadcrumbs.setHome({
      name: Settings.get().siteTitle,
      url: "/"
    }));
  }

}

export default new App();
