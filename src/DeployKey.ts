import * as fs from "fs";
import * as path from "path";
import {SshDir} from "./config";
import Settings from "./Settings";
import {spawnp} from "./utils";

export default class DeployKey {

  public constructor(private id: string) {
  }

  public get exists(): boolean {
    return fs.existsSync(this.privateFile);
  }

  public async discard() {
    await fs.unlinkSync(this.privateFile);
    await fs.unlinkSync(this.publicFile);
  }

  public async generate(comment: string) {
    return spawnp("ssh-keygen", ["-f", this.privateFile, "-t", "rsa", "-P", Settings.get().sshPassPhrase, "-C",
      comment || "MkDocs Server"]);
  }

  public get publicKey() {
    return fs.readFileSync(this.publicFile).toString();
  }

  public get privateFile() {
    return path.join(SshDir, this.id);
  }

  private get publicFile() {
    return path.join(SshDir, `${this.id}.pub`);
  }

}
