/* tslint:disable */
import "sst";
declare module "sst" {
  export interface Resource {
    APIToken: {
      type: "sst.sst.Secret";
      value: string;
    };
    Hono: {
      name: string;
      type: "sst.aws.Function";
      url: string;
    };
    JWTSecret: {
      type: "sst.sst.Secret";
      value: string;
    };
    Solo: {
      type: "sst.aws.StaticSite";
      url: string;
    };
    Users: {
      name: string;
      type: "sst.aws.Dynamo";
    };
  }
}
export {};
