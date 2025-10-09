// ecosystem.config.cjs
module.exports = {
  apps: [
    {
      name: "DbSync-a",
      script: "./index.js",
      cwd: ".",
      // Windows yollarını ters-eksiyle yazabilirsiniz; node hepsini anlar.
      node_args: "--max-old-space-size=8192",
      env: {
        NODE_ENV: "production",
        // A için .env ve config:
        ENV_PATH: "env/.env.app1",
        CONFIG_PATH: "./configs/app1.config.json"
      }
    },
    {
      name: "DbSync-b-Debug",
      script: "./index.js",
      node_args: "--inspect=9229",
      watch: false,
      cwd: ".",
      node_args: "--max-old-space-size=8192",
      env: {
        NODE_ENV: "development",
        // B için .env ve config:
        ENV_PATH: "env/.env.app2",
        CONFIG_PATH: "./configs/app2.config.json"
      }
    }
  ]
};
