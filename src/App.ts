import sms = require("source-map-support");

sms.install();

import * as BPromise from "bluebird";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as breadcrumbs from "express-breadcrumbs";
import * as session from "express-session";
import * as httpShutdown from "http-shutdown";
import * as _ from "lodash";

import {Application} from "express";
import * as http from "http";
import {Server} from "http";
import {authRoutes, ensureAuthenticated, isAuthenticated} from "./auth/passport";
import Project, {ProjectEvent} from "./Project";
import Settings, {SettingEvent} from "./Settings";
import configRouter from "./views/config";

declare global {
  namespace Express {
    interface Request {
      originalUrl?: string;
      breadcrumbs(name: string, url: string): Array<{ name: string; url: string; }>;
    }
  }
}

class App {
  public express: Application;
  private router;
  private port: number;
  private server: Server & { shutdown: (() => void) };

  constructor() {
    Settings.events.on(SettingEvent.updated, () => {
      this.refreshSiteTitle();
    });

    Settings.events.on(SettingEvent.authChanged, () => {
      console.log("SettingEvent.authChanged");
      setTimeout(() => this.restart());
    });

    Project.events.on(ProjectEvent.docsPublished, () => {
      this.configStaticSites();
    });

    this.initialize();
  }

  public async listen(port: number) {
    this.port = port;
    this.server = httpShutdown(http.createServer(this.express));
    await BPromise.promisify<Server, number>(this.server.listen, {context: this.server})(port);
    console.log(`MkDocs Service is listening on ${port}`);
  }

  public configStaticSites() {
    Project.publishedProjects()
      .forEach((project) => {
        const siteDirectory = project.siteDirectory;
        console.log("Mapping", `/${project.id}`, "to", siteDirectory);
        this.express.use(`/${project.id}`, ensureAuthenticated, express.static(siteDirectory));
      });
  }

  private initialize() {
    console.log("Initializing...");
    this.express = express();
    this.router = express.Router();

    this.configParsers();
    this.configPassport();
    this.configViews();
    this.mountRoutes();
    this.refreshSiteTitle();
    this.configStaticSites();
  }

  private async restart() {
    console.log("Stopping server...");
    await BPromise.promisify(this.server.shutdown, {context: this.server})();
    this.initialize();
    return this.listen(this.port);
  }

  private configPassport() {

    const settings = Settings.get();
    const auth = settings.auth;

    if (!auth || !auth.google) {
      return;
    }

    this.router.use(session({
      secret: settings.sessionSecret,
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
    this.express.use("/!config", ensureAuthenticated, configRouter);
  }

  private refreshSiteTitle() {
    this.router.use(breadcrumbs.setHome({
      name: Settings.get().siteTitle,
      url: "/"
    }));
  }

}

export default new App();
