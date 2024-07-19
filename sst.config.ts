/* eslint-disable */
/// <reference path="./.sst/platform/config.d.ts" />

export default $config({
  app(input) {
    return {
      name: "solo",
      removal: input?.stage === "production" ? "retain" : "remove",
      home: "aws",
    };
  },
  async run() {
    const apiToken = new sst.Secret("APIToken");
    const jwtSecret = new sst.Secret("JWTSecret");

    const usersTable = new sst.aws.Dynamo("Users", {
      fields: {
        email: "string",
      },
      primaryIndex: { hashKey: "email" },
    });

    const hono = new sst.aws.Function("Hono", {
      url: true,
      handler: "src/api/index.handler",
      link: [usersTable, jwtSecret, apiToken],
      runtime: "nodejs20.x",
    });

    new sst.aws.StaticSite("Solo", {
      build: {
        command: "npm run build",
        output: "dist",
      },
      environment: {
        VITE_API_BASE_URL: hono.url,
      },
    });

    return {
      api: hono.url,
    };
  },
});
