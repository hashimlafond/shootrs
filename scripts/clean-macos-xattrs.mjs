import { execFileSync } from "node:child_process";
import { existsSync } from "node:fs";
import { join } from "node:path";

const paths = [
  join(process.cwd(), "dist"),
  join(process.cwd(), "assets"),
  join(process.cwd(), "ios", "App", "App"),
].filter(existsSync);

for (const path of paths) {
  execFileSync("xattr", ["-cr", path], { stdio: "inherit" });
}
