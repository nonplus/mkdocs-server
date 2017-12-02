import sms = require("source-map-support");

sms.install();

import * as BPromise from "bluebird";
import * as bodyParser from "body-parser";
import * as cookieParser from "cookie-parser";
import * as express from "express";
import * as breadcrumbs from "express-breadcrumbs";
import * as httpShutdown from "http-shutdown";
import * as _ from "lodash";

import session = require("cookie-session");
import {Application} from "express";
import * as http from "http";
import {Server} from "http";
import {authProviders, authRoutes, ensureAuthenticated, isAuthenticated} from "./auth/passport";
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

  private configStaticSites() {
    Project.publishedProjects()
      .forEach(project => {
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
      name: "session",
      secret: settings.sessionSecret,
      maxAge: 30 * 24 * 60 * 60000
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
    router.use(breadcrumbs.setHome());
    router.get("/", (req, res) => {
      if (isAuthenticated(req)) {
        res.render("projects", {
          siteTitle: Settings.get().siteTitle,
          usesAuthentication: Settings.usesAuthentication,
          canAdmin: canAdmin(req.user),
          projects: _.sortBy(Project.publishedProjects(), project => (project.title || "").toLowerCase())
        });
      } else {
        res.render("login", {
          siteTitle: Settings.get().siteTitle,
          authProviders: _.filter(authProviders, authProvider =>
            (Settings.get().auth[authProvider.provider] || {}).clientSecret)
        });
      }
    });
    this.express.use("/", router);
    this.express.use("/!config", ensureAuthenticated, ensureAdmin, configRouter);
  }

}

export default new App();

function canAdmin(user) {
  return !user || Settings.canAdmin(user.email);
}

function ensureAdmin(req, res, next) {
  if (canAdmin(req.user)) {
    next();
  } else {
    res.redirect("/");
  }
}
