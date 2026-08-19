import { readFile, writeFile } from "node:fs/promises";

const appEntryUrl = new URL("../dist/app/index.html", import.meta.url);
const iosEntryUrl = new URL("../ios/App/App/public/index.html", import.meta.url);
const routeBootstrap = `    <script>
      if (window.location.pathname === "/" || window.location.pathname === "/index.html") {
        window.history.replaceState({}, "", "/app");
      }
    </script>
`;

const appEntry = await readFile(appEntryUrl, "utf8");
const nativeEntry = appEntry.replace(
  '    <script type="module"',
  `${routeBootstrap}    <script type="module"`,
);

if (nativeEntry === appEntry) {
  throw new Error("Could not locate the Shootr app module entry.");
}

await writeFile(iosEntryUrl, nativeEntry);
