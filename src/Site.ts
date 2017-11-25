import {spawn, SpawnOptions} from 'child_process';
import * as BPromise from "bluebird";
import db from "./db/db";
import * as _ from "lodash";
import * as path from "path";

import app from "./App";

const YAML = require('yamljs');

enum SiteStatus {
  new,
  repoCloned,
  docsPublished
}

enum SiteActivity {
  cloningRepo,
  updatingRepo,
  publishingDocs
}

interface SiteConfig {
  name: string;
  title: string;
  repo: string;
  status: SiteStatus | null;
  activity: SiteActivity | null;
  error: {
    code: number;
    message: string;
    log: string;
  } | null;
  mkdocsConfig: {
    site_name: string;
    site_url?: string;
    site_description?: string;
    site_author?: string;
    site_dir?: string;
  }
}

export default class Site {
  name: string;
  title: string;
  repo: string;
  status: SiteStatus;
  activity: SiteActivity | null;
  error: {
    code: number;
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

  static resolve(name: string) {
    const config = db.get("sites").find({name}).value();
    if (config) {
      return new Site(config);
    } else {
      return null;
    }
  }

  static allSites() {
    return db.get("sites").map(config => new Site(config)).value();
  }

  static publishedSites() {
    return db
      .get("sites")
      .filter({status: SiteStatus.docsPublished})
      .map(config => new Site(config))
      .value();
  }

  constructor(config: SiteConfig) {
    this.name = config.name;
    this.title = config.title;
    this.repo = config.repo;
    this.error = config.error;
    this.activity = config.activity || null;
    this.mkdocsConfig = config.mkdocsConfig;
    this.status = config.status || SiteStatus.new;
  }

  get statusLabel(): string {
    switch (this.status) {
      case SiteStatus.new:
        return "New";
      case SiteStatus.repoCloned:
        return "Cloned";
      case SiteStatus.docsPublished:
        return "Published";
      default:
        `Unknown ${this.status}`;
    }
  }

  get siteDirectory(): string {
    return path.join("repos", this.name, this.mkdocsConfig ? this.mkdocsConfig.site_dir : "site")
  }

  get siteDescription(): string {
    return (this.mkdocsConfig ? this.mkdocsConfig.site_description : "") || "";
  }

  get activityLabel(): string {
    if (!Boolean(this.activity)) {
      return "";
    }
    switch (this.activity) {
      case SiteActivity.cloningRepo:
        return "Cloning Repo...";
      case SiteActivity.updatingRepo:
        return "Updating Repo...";
      case SiteActivity.publishingDocs:
        return "Publishing...";
    }

    return `Unknown ${this.activity}...`;
  }

  async initialize() {
    await this.cloneRepo();
    this.refreshMkdDocsInfo();
    await this.publishDocs();
  }

  async rebuild() {
    if (this.status == SiteStatus.new) {
      await this.cloneRepo();
    } else {
      await this.updateRepo();
    }
    await this.publishDocs();
  }

  async cloneRepo() {
    const dfd = BPromise.defer();

    this.update({activity: SiteActivity.cloningRepo, error: null});

    const gitClone = this.spawn('git', ['clone', '--depth=1', this.repo, this.name], {
      cwd: "./repos"
    });

    return gitClone
      .then(() => {
        this.update({
          activity: null,
          status: SiteStatus.repoCloned
        });
      }, err => {
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

  resolve() {
    return Site.resolve(this.name);
  }

  update(options: Partial<SiteConfig>) {
    console.log("update", this.name, JSON.stringify(options));
    db.get("sites").find({name: this.name})
      .assign(options)
      .write();
    _.extend(this, options);
  }

  async updateRepo() {
    const dfd = BPromise.defer();

    this.update({activity: SiteActivity.updatingRepo, error: null});

    const gitPull = this.spawn('git', ['pull', '--depth=1', '-f'], {
      cwd: `./repos/${this.name}`
    });

    return gitPull
      .then(() => {
        this.update({
          activity: null
        });
      }, err => {
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

  async publishDocs() {
    const dfd = BPromise.defer();

    this.update({activity: SiteActivity.publishingDocs, error: null});

    const publish = this.spawn('mkdocs', ['build'], {
      cwd: `./repos/${this.name}`
    });

    return publish
      .then(() => {
        this.update({
          activity: null,
          status: SiteStatus.docsPublished
        });
      }, err => {
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

  private refreshMkdDocsInfo() {
    try {
      const doc = YAML.load(`./repos/${this.name}/mkdocs.yml`);
      const mkdocsConfig = _.pick(doc, "site_name", "site_url", "site_description", "site_author", "site_dir");
      if (!mkdocsConfig.site_dir) {
        mkdocsConfig.site_dir = "site";
      }
      db.get('sites')
        .find({name: this.name})
        .assign({mkdocsConfig, title: mkdocsConfig.site_name || this.title})
        .write();
      app.configStaticSites();
    } catch (e) {
      console.log(e);
    }
  }

  private async spawn(command: string, args?: string[], options?: SpawnOptions) {
    const dfd = BPromise.defer();

    this.update({activity: SiteActivity.cloningRepo, error: null});

    const childProcess = spawn(command, args, options);

    const log = [];

    childProcess.stdout.on('data', data => {
      console.log(`stdout: ${data}`);
    });

    childProcess.stderr.on('data', data => {
      log.push(data);
      console.log(`stderr: ${data}`);
    });

    childProcess.on('close', code => {
      console.log(`child process exited with code ${code}`);
      if (code) {
        const error = new Error();
        error["code"] = code;
        error["log"] = log.join();
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
