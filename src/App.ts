import * as path from "path";

require("source-map-support").install();
import * as express from "express";
import * as bodyParser from "body-parser";
import adminRouter from "./views/admin/routes";
import db from "./db/db";
import Project from "./Project";

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
    Project.publishedProjects()
      .forEach(project => {
        let siteDirectory = project.siteDirectory;
        console.log("Mapping", `/${project.id}`, "to", siteDirectory);
        this.express.use(`/${project.id}`, express.static(siteDirectory))
      });
  }

  private mountRoutes(): void {
    const router = express.Router();
    router.get("/", (req, res) => {
      res.render("home", {
        projects: Project.publishedProjects()
      });
    });
    this.express.use("/", router);
    this.express.use("/\\$admin", adminRouter);
  }

}

export default new App();
