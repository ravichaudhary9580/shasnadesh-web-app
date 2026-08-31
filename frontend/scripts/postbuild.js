const { spawnSync } = require("child_process");

// Skip react-snap in Vercel build environment.
if (process.env.VERCEL) {
  console.log("Skipping react-snap on Vercel.");
  process.exit(0);
}

try {
  const result = spawnSync("npx", ["react-snap"], {
    stdio: "inherit",
    shell: true,
  });
  if (result.error) {
    console.warn("react-snap warning:", result.error.message);
  }
} catch (err) {
  console.warn("react-snap execution skipped:", err.message);
}

process.exit(0);

