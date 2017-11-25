import * as express from "express";
import db from "../../db/db";
import Site from "../../Site";

const router = express.Router();

export default router;

router.get("/", (req, res) => {
  res.render("admin/index", {
    sites: Site.allSites()
  });
});

router.get("/new-site", (req, res) => {
  res.render("admin/new-site");
});

router.post("/new-site", (req, res) => {
  const {repo, name, title} = req.body;
  console.log({repo, name, title});

  // TODO: Sanitize repo

  const sites = db.get("sites");
  const existing = Site.resolve(name);

  if (existing) {
    res.render("admin/new-site", {
      repo, name, title, $alert: {
        danger: `The "${name}" name is already used by the "${existing.title}" site.`
      }
    });
  } else {
    sites
      .push({repo, name, title})
      .write();
    res.redirect("/");
    Site.resolve(name)
      .initialize();
  }
});

router.post("/rebuild/:site", (req, res) => {
  const name = req.params.site;
  const site = Site.resolve(name);
  let $alert;

  if (!site) {
    $alert = {danger: `The site "${name}" does not exist.`};
  } else {
    $alert = {info: `Rebuilding "${name}"...`};
    site.rebuild()
      .then(() => console.log("Rebuild finished!"), err => console.error("Rebuild failed", err));
  }

  res.render("admin/index", {
    sites: Site.allSites(),
    $alert
  });

});
