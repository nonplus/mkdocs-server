import * as express from "express";

class App {
  public app;

  constructor() {
    this.app = express();
    this.configViews();
    this.mountRoutes();
  }

  private configViews() {
    this.app.set("views", "./src/views");
    this.app.set("view engine", "pug");
  }

  private mountRoutes(): void {
    const router = express.Router();
    router.get("/", (req, res) => {
      const sites = [{
        title: "First Site",
        name: "first"
      }, {
        title: "Second Site",
        name: "second"
      }, {
        title: "Third Site",
        name: "third"
      }, {
        title: "Fourth Site",
        name: "fourth"
      }];
      res.render("home", {
        sites
      });
    });
    this.app.use("/", router);
  }
}

export default new App().app;
