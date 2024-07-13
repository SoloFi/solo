import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { bearerAuth } from "hono/bearer-auth";
import { jwt, sign } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

import YahooQuote from "./YahooQuote";
import YahooSearch from "./YahooSearch";
import { portfolioSchema, type Portfolio, type QuoteRange } from "./types";
import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import bcrypt from "bcryptjs";
import isEmail from "validator/lib/isEmail";
import isStrongPassword from "validator/lib/isStrongPassword";
import { Resource } from "sst";
import { v4 as uuidv4 } from "uuid";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";

dayjs.extend(utc);

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
    if (!email || !isEmail(email)) {
      throw new HTTPException(400, { message: "Invalid email address." });
    }

    if (!password || !isStrongPassword(password)) {
      throw new HTTPException(400, {
        message:
          "Password must be at least 8 characters long and contain at least one uppercase letter, one lowercase letter, one number, and one special character.",
      });
    }

    const userItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email: data.email,
      },
    });
    const user = userItem.Item;
    if (user) {
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

    const payload = {
      sub: email,
      exp: dayjs().utc().unix() + 60 * 60 * 24, // Token expires in 24 hours
    };
    const token = await sign(payload, JWT_SECRET);
    return c.json({ token });
  })
  .post("/signIn", async (c) => {
    const data = await c.req.json();
    const email = data.email;
    const password = data.password;
    if (!email || !isEmail(email) || !password) {
      throw new HTTPException(400, { message: "Invalid email or password." });
    }

    const userItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email: data.email,
      },
    });
    const user = userItem.Item;
    if (!user || !user.password) {
      throw new HTTPException(400, {
        message: "Invalid email or password.",
      });
    }
    const passwordMatch = await bcrypt.compare(password, user.password);
    if (!passwordMatch) {
      throw new HTTPException(400, {
        message: "Invalid email or password.",
      });
    }

    const payload = {
      sub: user.email,
      exp: dayjs().utc().unix() + 60 * 60 * 24, // Token expires in 24 hours
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

    const userItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
    });
    const user = userItem.Item;

    if (!user || !user.portfolios) {
      return c.json([]);
    }
    return c.json(user.portfolios);
  })
  .put("/api/portfolio", async (c) => {
    const payload = c.get("jwtPayload");
    const email = payload.sub;
    if (!email) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const data = await c.req.json();
    data.id = uuidv4();
    // verifiy that data is valid
    try {
      portfolioSchema.parse(data);
    } catch (e) {
      throw new HTTPException(400, { message: (e as Error).message });
    }

    const userItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
    });
    const user = userItem.Item;
    if (!user) {
      throw new HTTPException(404, { message: "User not found." });
    }

    // check if the portfolio already exists or has the same name
    if (user.portfolios) {
      const existingPortfolio = user.portfolios.find(
        (portfolio: Portfolio) =>
          portfolio.name === data.name || portfolio.id === data.id,
      );
      if (existingPortfolio) {
        throw new HTTPException(400, {
          message: "A portfolio with this name or id already exists.",
        });
      }
    }

    const updatedPortfolios = user.portfolios ? [...user.portfolios, data] : [data];
    await db.update({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
      UpdateExpression: "SET portfolios = :portfolios",
      ExpressionAttributeValues: {
        ":portfolios": updatedPortfolios,
      },
    });
    return c.json(data);
  })
  .get("/api/portfolio/:id", async (c) => {
    const payload = c.get("jwtPayload");
    const email = payload.sub;
    if (!email) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const { id } = c.req.param();
    const userItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
    });
    const user = userItem.Item;
    if (!user || !user.portfolios) {
      throw new HTTPException(404, { message: "Portfolio not found." });
    }

    const portfolio = user.portfolios.find((portfolio: Portfolio) => portfolio.id === id);
    if (!portfolio) {
      throw new HTTPException(404, { message: "Portfolio not found." });
    }
    return c.json(portfolio);
  })
  .post("/api/portfolio/:id", async (c) => {
    const payload = c.get("jwtPayload");
    const email = payload.sub;
    if (!email) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const { id } = c.req.param();
    const data = await c.req.json();
    const userItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
    });
    const user = userItem.Item;
    if (!user || !user.portfolios) {
      throw new HTTPException(404, { message: "Portfolio not found." });
    }

    const updatedPortfolios = user.portfolios.map((portfolio: Portfolio) => {
      if (portfolio.id === id) {
        return {
          ...portfolio,
          ...data,
        };
      }
      return portfolio;
    });
    await db.update({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
      UpdateExpression: "SET portfolios = :portfolios",
      ExpressionAttributeValues: {
        ":portfolios": updatedPortfolios,
      },
    });
    return c.json({ message: "Portfolio updated successfully." });
  })
  .delete("/api/portfolio/:id", async (c) => {
    const payload = c.get("jwtPayload");
    const email = payload.sub;
    if (!email) {
      throw new HTTPException(401, { message: "Unauthorized" });
    }

    const { id } = c.req.param();
    const userItem = await db.get({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
    });
    const user = userItem.Item;
    if (!user || !user.portfolios) {
      throw new HTTPException(404, { message: "Portfolio not found." });
    }

    const updatedPortfolios = user.portfolios.filter(
      (portfolio: Portfolio) => portfolio.id !== id,
    );
    await db.update({
      TableName: USERS_TABLE,
      Key: {
        email,
      },
      UpdateExpression: "SET portfolios = :portfolios",
      ExpressionAttributeValues: {
        ":portfolios": updatedPortfolios,
      },
    });
    return c.json({ message: "Portfolio deleted successfully." });
  })
  .get("/api/quote/:symbol", async (c) => {
    const { symbol } = c.req.param();
    const YQ = new YahooQuote();
    const quote = await YQ.getLatestQuote(symbol);
    return c.json(quote);
  })
  // Foreign exchange quote
  .get("/api/fx/:symbol", async (c) => {
    const { symbol } = c.req.param();
    const YQ = new YahooQuote();
    const quote = await YQ.getLatestQuote(`${symbol.toUpperCase()}=X`);
    return c.json(quote.close);
  })
  .post("/api/chart/:symbol", async (c) => {
    const { symbol } = c.req.param();
    const { from, to, range, interval } = await c.req.json();
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
