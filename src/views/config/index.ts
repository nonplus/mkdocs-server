import * as express from "express";

import authRouter from "./auth";
import projectsRouter from "./projects";
import settingsRouter from "./settings";

const router = express.Router();

export default router;

router.get("/", (req, res) => {
  res.redirect("/!config/projects");
});

router.use("/auth", authRouter);
router.use("/projects", projectsRouter);
router.use("/settings", settingsRouter);
