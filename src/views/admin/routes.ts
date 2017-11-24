import * as express from "express";
import db from "../../db/db";

const router = express.Router();

export default router;

router.get("/", (req, res) => {
  res.render("admin/index", {
    sites: db.get("sites").value()
  });
});

router.get("/new-site", (req, res) => {
  res.render("admin/new-site");
});

router.post("/new-site", (req, res) => {
  const {repo, name, title} = req.body;
  console.log({repo, name, title});

  const sites = db.get("sites");
  const existing = sites.find({name}).value();

  if (existing) {
    res.render("admin/new-site", {
      repo, name, title, $alert: {
        danger: `The "${name}" name is already used by the "${title}" site.`
      }
    });
  } else {
    sites
      .push({repo, name, title})
      .write();
    res.redirect("/");
  }
});
