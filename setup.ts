import crypto from "crypto";
import { $ } from "bun";

const keyGen = () => crypto.randomBytes(32).toString("hex");
const apiKey = keyGen();
const jwtSecret = keyGen();

(async () => {
  await $`echo "API_TOKEN=${apiKey}
JWT_SECRET=${jwtSecret}" > .env`;
  console.log("JWT_SECRET and API_KEY generated and saved to .env file");

  console.log("API_TOKEN: ", apiKey);
  console.log("JWT_SECRET:", jwtSecret);
})();
