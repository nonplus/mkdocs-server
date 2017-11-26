import * as express from "express";

import projectsRouter from "./projects";

const router = express.Router();

export default router;

router.use((req, res, next) => {
  req.breadcrumbs("Config", "/$config");
  next();
});

router.get("/", (req, res) => {
  res.render("config/index", {
    breadcrumbs: req.breadcrumbs
  });
});

router.use("/projects", projectsRouter);
