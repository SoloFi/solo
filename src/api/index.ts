import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { bearerAuth } from "hono/bearer-auth";
import { jwt, sign } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

import YahooQuote from "./YahooQuote";
import YahooSearch from "./YahooSearch";
import type { QuoteRange } from "./types";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import isEmail from "validator/lib/isEmail";
import isStrongPassword from "validator/lib/isStrongPassword";
import { Resource } from "sst";

const USERS_TABLE = Resource.Users.name;
const JWT_SECRET = Resource.JWTSecret.value;
const API_TOKEN = Resource.APIToken.value;

const db = DynamoDBDocument.from(new DynamoDB({ region: "us-east-1" }), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

type Variables = JwtVariables;
const app = new Hono<{ Variables: Variables }>();

app.use(
  "/api/*",
  jwt({
    secret: JWT_SECRET,
  }),
);

app.use("/signUp", bearerAuth({ token: API_TOKEN }));

app
  .post("/signUp", async (c) => {
    const data = await c.req.json();
    const email = data.email;
    const password = data.password;
    if (!email || !isEmail(email) || !password || !isStrongPassword(password)) {
      throw new HTTPException(400, { message: "Invalid email or password." });
    }

    const existingUserItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email: data.email,
      },
    });
    const existingUser = existingUserItem.Item;
    if (existingUser) {
      throw new HTTPException(400, {
        message: "An account with this email already exists.",
      });
    }

    const passwordHash = await bcrypt.hash(password, 10);
    await db.put({
      TableName: USERS_TABLE,
      Item: {
        email,
        password: passwordHash,
        portfolios: [],
      },
    });

    return c.json({ message: `Account created successfully for ${email}.` });
  })
  .post("/signIn", async (c) => {
    const data = await c.req.json();
    const email = data.email;
    const password = data.password;
    if (!email || !isEmail(email) || !password) {
      throw new HTTPException(400, { message: "Invalid email or password." });
    }

    const existingUserItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email: data.email,
      },
    });
    const existingUser = existingUserItem.Item;
    if (!existingUser || !existingUser.password) {
      throw new HTTPException(400, {
        message: "Invalid email or password.",
      });
    }
    const passwordMatch = await bcrypt.compare(password, existingUser.password);
    if (!passwordMatch) {
      throw new HTTPException(400, {
        message: "Invalid email or password.",
      });
    }

    const payload = {
      sub: existingUser.email,
      exp: Math.floor(Date.now() / 1000) + 60 * 60 * 24, // Token expires in 24 hours
    };
    const token = await sign(payload, JWT_SECRET);
    return c.json({ token });
  })
  .get("/api/portfolios", async (c) => {
    const payload = c.get("jwtPayload");
    const email = payload.sub;
    if (!email) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const existingUserItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
    });
    const existingUser = existingUserItem.Item;

    if (!existingUser || !existingUser.portfolios) {
      return c.json([]);
    }
    return c.json(existingUser.portfolios);
  })
  .post("/api/chart/:symbol", async (c) => {
    const { symbol } = c.req.param();
    const { from, to, range, interval } = c.req.query();
    const YQ = new YahooQuote();
    const candlestickData = await YQ.getCandlestickData({
      symbol,
      interval: interval ?? "1d",
      range: range as QuoteRange | undefined,
      fromDate: from,
      toDate: to,
    });
    return c.json(candlestickData);
  })
  .get("/api/search/:query", async (c) => {
    const YS = new YahooSearch();
    const { query } = c.req.param();
    const items = await YS.search({ query });
    return c.json(items);
  });

export const handler = handle(app);
