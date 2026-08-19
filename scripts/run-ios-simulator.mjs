import { execFileSync } from "node:child_process";
import { dirname } from "node:path";

function run(command, args, options = {}) {
  return execFileSync(command, args, {
    encoding: "utf8",
    env: {
      ...process.env,
      PATH: `${dirname(process.execPath)}:${process.env.PATH || ""}`,
    },
    stdio: options.stdio || "pipe",
  });
}

function fail(message) {
  console.error(message);
  process.exit(1);
}

const developerDir = process.env.DEVELOPER_DIR || run("xcode-select", ["-p"]).trim();

if (!developerDir.includes(".app/Contents/Developer")) {
  fail(`Full Xcode is not selected. Current developer directory: ${developerDir}

Install/open Xcode, then run one of:
sudo xcode-select -s /Applications/Xcode.app/Contents/Developer
DEVELOPER_DIR=/path/to/Xcode-beta.app/Contents/Developer node scripts/run-ios-simulator.mjs`);
}

let simulatorJSON;

try {
  simulatorJSON = JSON.parse(run("xcrun", ["simctl", "list", "devices", "available", "-j"]));
} catch (error) {
  fail(`Could not read available iOS simulators. Open Xcode > Settings > Platforms and install an iOS Simulator runtime.

${error.message}`);
}

const runtimes = Object.entries(simulatorJSON.devices || {})
  .filter(([runtime]) => runtime.includes("iOS"))
  .map(([runtime, devices]) => ({
    runtime,
    version: Number((runtime.match(/iOS-(\d+)-?(\d+)?/) || []).slice(1).filter(Boolean).join(".")) || 0,
    devices: devices.filter((device) => device.isAvailable && device.name.includes("iPhone")),
  }))
  .filter((runtime) => runtime.devices.length)
  .sort((a, b) => b.version - a.version);

if (!runtimes.length) {
  fail("No available iPhone simulators found. Install an iOS Simulator runtime in Xcode > Settings > Platforms.");
}

const preferredNames = [
  "iPhone 16 Pro",
  "iPhone 16",
  "iPhone 15 Pro",
  "iPhone 15",
  "iPhone 14 Pro",
  "iPhone 14",
  "iPhone SE",
];

const latestRuntime = runtimes[0];
const selected =
  preferredNames.map((name) => latestRuntime.devices.find((device) => device.name === name)).find(Boolean) ||
  latestRuntime.devices[0];

console.log(`Selected simulator: ${selected.name} (${latestRuntime.runtime}) ${selected.udid}`);

if (selected.state !== "Booted") {
  run("xcrun", ["simctl", "boot", selected.udid], { stdio: "inherit" });
}

try {
  run("open", [`${developerDir}/Applications/Simulator.app`], { stdio: "inherit" });
} catch {
  console.warn("Simulator UI app was not found in the selected Xcode bundle. Continuing with command-line install.");
}

run("./node_modules/.bin/cap", ["sync", "ios"], { stdio: "inherit" });

const derivedDataPath = `ios/DerivedData/${selected.udid}`;
const appPath = `${derivedDataPath}/Build/Products/Debug-iphonesimulator/App.app`;
const bundleId = "com.shootr.app";

run(
  "xcodebuild",
  [
    "-project",
    "ios/App/App.xcodeproj",
    "-scheme",
    "App",
    "-configuration",
    "Debug",
    "-destination",
    `id=${selected.udid}`,
    "-derivedDataPath",
    derivedDataPath,
  ],
  { stdio: "inherit" },
);

run("xcrun", ["simctl", "install", selected.udid, appPath], { stdio: "inherit" });
run("xcrun", ["simctl", "launch", selected.udid, bundleId], { stdio: "inherit" });

console.log(`Shootr launched on ${selected.name}.`);
