import sms = require("source-map-support");

sms.install();

import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as breadcrumbs from "express-breadcrumbs";
import * as session from "express-session";
import * as _ from "lodash";
import * as passport from "passport";

import {authenticated, authRoutes, isAuthenticated} from "./auth/passport";
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
    this.router = express.Router();

    this.configParsers();
    this.configPassport();
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
        this.express.use(`/${project.id}`, authenticated, express.static(siteDirectory));
      });
  }

  private configPassport() {

    const settings = Settings.get();
    const auth = settings.auth;

    console.log("settings", settings);

    if (!auth || !auth.google) {
      return;
    }

    this.router.use(session({
      secret: "ilovescotchscotchyscotchscotch",
      resave: false,
      saveUninitialized: true,
      cookie: {
        maxAge: 60000
      }
    }));

    authRoutes(this.router, auth);
  }

  private configParsers() {
    this.express.use(cookieParser());
    this.express.use(bodyParser.urlencoded({extended: false}));
  }

  private configViews() {
    this.express.set("views", "./src/views");
    this.express.set("view engine", "pug");
  }

  private mountRoutes(): void {
    const router = this.router;
    router.use(breadcrumbs.init());

    router.get("/", (req, res) => {
      if (isAuthenticated(req)) {
        res.render("projects", {
          siteTitle: Settings.get().siteTitle,
          usesAuthentication: Settings.usesAuthentication,
          projects: _.sortBy(Project.publishedProjects(), (project) => (project.title || "").toLowerCase())
        });
      } else {
        res.render("login", {
          siteTitle: Settings.get().siteTitle,
        });
      }
    });
    this.express.use("/", router);
    this.express.use("/\\$config", authenticated, configRouter);
  }

  private refreshSiteTitle() {
    this.router.use(breadcrumbs.setHome({
      name: Settings.get().siteTitle,
      url: "/"
    }));
  }

}

export default new App();

