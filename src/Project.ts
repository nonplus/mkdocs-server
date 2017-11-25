import * as BPromise from "bluebird";
import {spawn, SpawnOptions} from "child_process";
import * as _ from "lodash";
import * as path from "path";
import db from "./db/db";

import rimraf = require("rimraf");
import app from "./App";

import YAML = require("yamljs");

enum ProjectStatus {
  new,
  repoCloned,
  docsPublished
}

enum ProjectActivity {
  cloningRepo,
  updatingRepo,
  publishingDocs,
  resettingProject,
  deletingProject
}

interface ProjectConfig {
  id: string;
  title: string;
  repo: string;
  status: ProjectStatus | null;
  activity: ProjectActivity | null;
  error: {
    code?: number;
    message: string;
    log: string;
  } | null;
  mkdocsConfig: {
    site_name: string;
    site_url?: string;
    site_description?: string;
    site_author?: string;
    site_dir?: string;
  };
}

export default class Project {

  public static resolve(id: string) {
    const config = db.get("projects").find({id}).value();
    if (config) {
      return new Project(config);
    } else {
      return null;
    }
  }

  public static allProjects() {
    return db.get("projects").map((config) => new Project(config)).value();
  }

  public static publishedProjects() {
    return db
      .get("projects")
      .filter({status: ProjectStatus.docsPublished})
      .map((config) => new Project(config))
      .value();
  }

  public id: string;
  public title: string;
  public repo: string;
  public status: ProjectStatus;
  public activity: ProjectActivity | null;
  public error: {
    code?: number;
    message: string;
    log: string;
  } | null;
  public mkdocsConfig: {
    site_name: string;
    site_url?: string;
    site_description?: string;
    site_author?: string;
    site_dir?: string;
  };

  constructor(config: ProjectConfig) {
    this.id = config.id;
    this.title = config.title;
    this.repo = config.repo;
    this.error = config.error;
    this.activity = config.activity || null;
    this.mkdocsConfig = config.mkdocsConfig;
    this.status = config.status || ProjectStatus.new;
  }

  get statusLabel(): string {
    switch (this.status) {
      case ProjectStatus.new:
        return "New";
      case ProjectStatus.repoCloned:
        return "Cloned";
      case ProjectStatus.docsPublished:
        return "Published";
      default:
        return `Unknown ${this.status}`;
    }
  }

  get siteDirectory(): string {
    return path.join(this.repoDirectory, this.mkdocsConfig ? this.mkdocsConfig.site_dir : "site");
  }

  get repoDirectory(): string {
    return path.join("repos", this.id);
  }

  get siteDescription(): string {
    return (this.mkdocsConfig ? this.mkdocsConfig.site_description : "") || "";
  }

  get activityLabel(): string {
    if (!Boolean(this.activity)) {
      return "";
    }

    switch (this.activity) {
      case ProjectActivity.cloningRepo:
        return "Cloning Repo...";
      case ProjectActivity.updatingRepo:
        return "Updating Repo...";
      case ProjectActivity.publishingDocs:
        return "Publishing...";
      case ProjectActivity.resettingProject:
        return "Resetting...";
      case ProjectActivity.deletingProject:
        return "Deleting...";
    }

    return `Unknown ${this.activity}...`;
  }

  public async initialize() {
    await this.cloneRepo();
    this.refreshMkdDocsInfo();
    await this.publishDocs();
  }

  public async resetProject() {
    this.update({
      status: ProjectStatus.new,
      activity: ProjectActivity.resettingProject,
      error: null
    });

    const repoDirectory = this.repoDirectory;

    const promise = this.deleteRepo();

    promise.then(
      () => this.update({
        mkdocsConfig: null,
        activity: null
      }),
      (err) => this.update({
        mkdocsConfig: null,
        activity: null,
        error: {
          message: `Failed deleting ${repoDirectory}`,
          log: err.toString()
        }
      })
    );

    return promise;
  }

  public async deleteProject() {
    const id = this.id;

    this.update({
      status: ProjectStatus.new,
      activity: ProjectActivity.deletingProject,
      error: null
    });

    const repoDirectory = this.repoDirectory;

    const promise = this.deleteRepo();

    promise.then(destroy, destroy);

    return promise;

    function destroy() {
      db.get("projects")
        .remove({ id })
        .write();
    }
  }

  public async rebuild() {
    if (this.status === ProjectStatus.new) {
      await this.cloneRepo();
    } else {
      await this.updateRepo();
    }
    await this.publishDocs();
  }

  public async cloneRepo() {
    const dfd = BPromise.defer();

    this.update({activity: ProjectActivity.cloningRepo, error: null});

    const gitClone = this.spawn("git", ["clone", "--depth=1", this.repo, this.id], {
      cwd: "./repos"
    });

    return gitClone
      .then(() => {
        this.update({
          activity: null,
          status: ProjectStatus.repoCloned
        });
      }, (err) => {
        this.update({
          activity: null,
          error: {
            message: "Failed cloning repo",
            code: err.code,
            log: err.log
          }
        });
      });
  }

  public resolve() {
    return Project.resolve(this.id);
  }

  public update(options: Partial<ProjectConfig>) {
    console.log("update", this.id, JSON.stringify(options));
    db.get("projects").find({id: this.id})
      .assign(options)
      .write();
    _.extend(this, options);
  }

  public async updateRepo() {
    const dfd = BPromise.defer();

    this.update({activity: ProjectActivity.updatingRepo, error: null});

    const gitPull = this.spawn("git", ["pull", "--depth=1", "-f"], {
      cwd: `./repos/${this.id}`
    });

    return gitPull
      .then(() => {
        this.update({
          activity: null
        });
      }, (err) => {
        this.update({
          activity: null,
          error: {
            message: "Failed updating repo",
            code: err.code,
            log: err.log
          }
        });
      });
  }

  public async publishDocs() {
    const dfd = BPromise.defer();

    this.update({activity: ProjectActivity.publishingDocs, error: null});

    const publish = this.spawn("mkdocs", ["build"], {
      cwd: `./repos/${this.id}`
    });

    return publish
      .then(() => {
        this.update({
          activity: null,
          status: ProjectStatus.docsPublished
        });
      }, (err) => {
        this.update({
          activity: null,
          error: {
            message: "Failed publishing docs",
            code: err.code,
            log: err.log
          }
        });
      });

  }

  private async deleteRepo() {
    const rimrafp = BPromise.promisify(rimraf);
    return rimrafp(this.repoDirectory);
  }

  private refreshMkdDocsInfo() {
    try {
      const doc = YAML.load(`./repos/${this.id}/mkdocs.yml`);
      const mkdocsConfig = _.pick(doc, "site_name", "site_url", "site_description", "site_author", "site_dir");
      if (!mkdocsConfig.site_dir) {
        mkdocsConfig.site_dir = "site";
      }
      db.get("projects")
        .find({id: this.id})
        .assign({mkdocsConfig, title: mkdocsConfig.site_name || this.title})
        .write();
      app.configStaticSites();
    } catch (e) {
      console.log(e);
    }
  }

  private async spawn(command: string, args?: string[], options?: SpawnOptions) {
    const dfd = BPromise.defer();

    const childProcess = spawn(command, args, options);

    const log = [];

    childProcess.stdout.on("data", (data) => {
      log.push(data);
      console.log(`stdout: ${data}`);
    });

    childProcess.stderr.on("data", (data) => {
      log.push(data);
      console.log(`stderr: ${data}`);
    });

    childProcess.on("close", (code) => {
      console.log(`child process exited with code ${code}`);
      if (code) {
        const error = new Error();
        error.code = code;
        error.log = log.join();
        dfd.reject(error);
      } else {
        dfd.resolve({
          log: log.join()
        });
      }
    });

    return dfd.promise;
  }

}