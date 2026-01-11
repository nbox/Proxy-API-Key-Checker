/* eslint-disable no-console */
const { execFileSync } = require("child_process");
const fs = require("fs");
const path = require("path");

exports.default = async function afterPack(context) {
  if (context.electronPlatformName !== "darwin") return;

  const appOutDir = context.appOutDir;
  const appName = fs.readdirSync(appOutDir).find((f) => f.endsWith(".app"));
  if (!appName) throw new Error(`No .app found in ${appOutDir}`);

  const appPath = path.join(appOutDir, appName);

  console.log(`Ad-hoc signing app bundle: ${appPath}`);

  // Re-sign the whole bundle to generate CodeResources and clear "no resources" errors.
  execFileSync("/usr/bin/codesign", ["--force", "--deep", "--sign", "-", appPath], {
    stdio: "inherit",
  });

  // Verify signature integrity after re-signing.
  execFileSync("/usr/bin/codesign", ["--verify", "--deep", "--strict", "--verbose=4", appPath], {
    stdio: "inherit",
  });

  // Gatekeeper will likely reject ad-hoc signatures; this is expected.
  try {
    execFileSync("/usr/sbin/spctl", ["-a", "-vv", appPath], { stdio: "inherit" });
  } catch {
    console.log("spctl rejected (expected for ad-hoc / unsigned).");
  }
};
