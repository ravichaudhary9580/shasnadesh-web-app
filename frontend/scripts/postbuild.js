const { spawnSync } = require("child_process");

// Skip react-snap in Vercel build environment.
if (process.env.VERCEL) {
  console.log("Skipping react-snap on Vercel.");
  process.exit(0);
}

const result = spawnSync("npx", ["react-snap"], {
  stdio: "inherit",
  shell: true,
});

process.exit(result.status || 0);
