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
    const hono = new sst.aws.Function("Hono", {
      url: true,
      handler: "src/api/index.handler",
    });

    return {
      api: hono.url,
    };
  },
});
