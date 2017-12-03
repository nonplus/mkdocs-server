import * as fs from "fs";
import * as path from "path";

export const DataDir = path.resolve("./data");
export const BinDir = path.resolve("./bin");
export const SshDir = path.resolve("./data/.ssh");
export const ReposDir = path.resolve("./data/repos");

[DataDir, SshDir, ReposDir].forEach(dir => {
  if (!fs.existsSync(dir)) {
    console.log(`Creating [${dir}]`);
    fs.mkdirSync(dir);
  }
});
