import { Hono } from "hono";
import { handle } from "hono/aws-lambda";
import { bearerAuth } from "hono/bearer-auth";
import { jwt, sign } from "hono/jwt";
import type { JwtVariables } from "hono/jwt";
import { HTTPException } from "hono/http-exception";

import YahooQuote from "./YahooQuote";
import YahooSearch from "./YahooSearch";
import {
  portfolioHoldingSchema,
  portfolioSchema,
  portfolioTransactionSchema,
} from "./types";
import type { QuoteRange } from "@/api/YahooQuote";
import bcrypt from "bcryptjs";
import isEmail from "validator/lib/isEmail";
import isStrongPassword from "validator/lib/isStrongPassword";
import { Resource } from "sst";
import dayjs from "dayjs";
import utc from "dayjs/plugin/utc";
import {
  addPortfolioHolding,
  addPortfolioTransaction,
  addUser,
  createPortfolio,
  deletePortfolioById,
  deletePortfolioHolding,
  deletePortfolioTransaction,
  getPortfolioById,
  getReqEmail,
  getUserByEmail,
  updatePortfolioById,
  updatePortfolioTransaction,
} from "./utils";
import { v4 as uuidv4 } from "uuid";

dayjs.extend(utc);

const JWT_SECRET = Resource.JWTSecret.value;
const API_TOKEN = Resource.APIToken.value;

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
    const user = await getUserByEmail(email);
    if (user) {
      throw new HTTPException(400, {
        message: "An account with this email already exists.",
      });
    }
    const passwordHash = await bcrypt.hash(password, 10);
    await addUser({
      email,
      password: passwordHash,
      portfolios: [],
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
    const user = await getUserByEmail(email);
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
  // Get user portfolios
  .get("/api/portfolios", async (c) => {
    const email = getReqEmail(c);
    const user = await getUserByEmail(email);
    if (!user || !user.portfolios) {
      return c.json([]);
    }
    return c.json(user.portfolios);
  })
  // Get portfolio by id
  .get("/api/portfolio/:id", async (c) => {
    const email = getReqEmail(c);
    const { id } = c.req.param();
    const portfolio = await getPortfolioById(email, id);
    return c.json(portfolio);
  })
  // Create portfolio
  .put("/api/portfolio", async (c) => {
    const email = getReqEmail(c);
    const data = await c.req.json();
    data.id = uuidv4();
    // verifiy that data is valid
    try {
      portfolioSchema.parse(data);
    } catch (e) {
      throw new HTTPException(400, { message: (e as Error).message });
    }
    await createPortfolio(email, data);
    return c.json(data);
  })
  // Delete portfolio
  .delete("/api/portfolio/:id", async (c) => {
    const email = getReqEmail(c);
    const { id } = c.req.param();
    await deletePortfolioById(email, id);
    return c.json({ message: "Portfolio deleted successfully." });
  })
  // Update portfolio
  .post("/api/portfolio/:id", async (c) => {
    const email = getReqEmail(c);
    const { id } = c.req.param();
    const data = await c.req.json();
    const { name, currency } = data;
    await updatePortfolioById(email, id, { name, currency });
    return c.json({ message: "Portfolio updated successfully." });
  })
  // Create holding
  .put("/api/portfolio/:id/holding", async (c) => {
    const email = getReqEmail(c);
    const { id } = c.req.param();
    const data = await c.req.json();
    // verify that data is valid
    try {
      portfolioHoldingSchema.parse(data);
    } catch (e) {
      throw new HTTPException(400, { message: (e as Error).message });
    }
    await addPortfolioHolding(email, id, data);
    return c.json({ message: "Added holding successfully." });
  })
  // Delete holding
  .delete("/api/portfolio/:id/holding/:symbol", async (c) => {
    const email = getReqEmail(c);
    const { id, symbol } = c.req.param();
    await deletePortfolioHolding(email, id, symbol);
    return c.json({ message: "Holding deleted successfully." });
  })
  // Create transaction
  .put("/api/portfolio/:id/holding/:symbol/tx", async (c) => {
    const email = getReqEmail(c);
    const { id, symbol } = c.req.param();
    const data = await c.req.json();
    data.id = uuidv4();
    // verify that data is valid
    try {
      portfolioTransactionSchema.parse(data);
    } catch (e) {
      throw new HTTPException(400, { message: (e as Error).message });
    }
    await addPortfolioTransaction(email, id, symbol, data);
    return c.json({ message: "Transaction added successfully." });
  })
  // Delete transaction
  .delete("/api/portfolio/:id/holding/:symbol/tx/:txId", async (c) => {
    const email = getReqEmail(c);
    const { id, symbol, txId } = c.req.param();
    await deletePortfolioTransaction(email, id, symbol, txId);
    return c.json({ message: "Transaction deleted successfully." });
  })
  // Update transaction
  .post("/api/portfolio/:id/holding/:symbol/tx/:txId", async (c) => {
    const email = getReqEmail(c);
    const { id, symbol, txId } = c.req.param();
    const data = await c.req.json();
    // verify that data is valid
    try {
      portfolioTransactionSchema.parse(data);
    } catch (e) {
      throw new HTTPException(400, { message: (e as Error).message });
    }
    await updatePortfolioTransaction(email, id, symbol, txId, data);
    return c.json({ message: "Transaction updated successfully." });
  })
  // Get lastest quote
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
  // Get historical quote
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
  // Search symbols
  .get("/api/search/:query", async (c) => {
    const YS = new YahooSearch();
    const { query } = c.req.param();
    const items = await YS.search({ query });
    return c.json(items);
  });

export const handler = handle(app);
