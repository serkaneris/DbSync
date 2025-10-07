// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "dbsync-a",
      script: "./index.js",
      cwd: ".",
      // Windows yollarını ters-eksiyle yazabilirsiniz; node hepsini anlar.
      env: {
        NODE_ENV: "production",
        // A için .env ve config:
        ENV_PATH: "env/.env.app1",
        CONFIG_PATH: "./configs/app1.config.json"
      }
    },
    {
      name: "dbsync-b",
      script: "./index.js",
      cwd: ".",
      env: {
        NODE_ENV: "production",
        // B için .env ve config:
        ENV_PATH: "env/.env.app2",
        CONFIG_PATH: "./configs/app2.config.json"
      }
    }
  ]
};
