import { rmSync } from "node:fs";
import { join } from "node:path";

rmSync(join(process.cwd(), "ios", "App", "App", "public"), {
  force: true,
  recursive: true,
});
