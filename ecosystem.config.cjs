// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "Erp-DbSync",
      script: "./index.js",
      cwd: ".",
      node_args: "--max-old-space-size=8192",
      env: {
        NODE_ENV: "production",
        // A için .env ve config:
        ENV_PATH: "env/.env.app1",
        CONFIG_PATH: "./configs/app1.config.json"
      }
    },
    {
      name: "Cost-DbSync",
      script: "./index.js",
      cwd: ".",
      node_args: "--max-old-space-size=8192",
      env: {
        NODE_ENV: "production",
        // B için .env ve config:
        ENV_PATH: "env/.env.app2",
        CONFIG_PATH: "./configs/app2.config.json"
      }
    }
  ]
};
