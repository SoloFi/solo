import fs from "fs";
import crypto from "crypto";

const keyGen = () => crypto.randomBytes(32).toString("hex");
const apiKey = keyGen();
const jwtSecret = keyGen();

(async () => {
  await fs.promises.writeFile(".env", `API_TOKEN=${apiKey}\nJWT_SECRET=${jwtSecret}`);
  console.log("JWT_SECRET and API_KEY generated and saved to .env file");

  console.log("API_TOKEN: ", apiKey);
  console.log("JWT_SECRET:", jwtSecret);
})();
