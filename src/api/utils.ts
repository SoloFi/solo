import { DynamoDB } from "@aws-sdk/client-dynamodb";
import { DynamoDBDocument } from "@aws-sdk/lib-dynamodb";
import { Context } from "hono";
import { HTTPException } from "hono/http-exception";
import { Resource } from "sst";
import { Portfolio, PortfolioHolding, PortfolioTransaction, User } from "./types";
import { currencies } from "@/lib/utils";
import YahooQuote from "./YahooQuote";

const USERS_TABLE = Resource.Users.name;

const db = DynamoDBDocument.from(new DynamoDB({ region: "us-east-1" }), {
  marshallOptions: {
    convertEmptyValues: true,
    removeUndefinedValues: true,
    convertClassInstanceToMap: true,
  },
});

export const addUser = async (user: User) => {
  await db.put({
    TableName: USERS_TABLE,
    Item: user,
  });
};

export const getReqEmail = (c: Context) => {
  const payload = c.get("jwtPayload");
  const email = payload.sub;
  if (!email) {
    throw new HTTPException(401, { message: "Unauthorized" });
  }
  return email;
};

export const getUserByEmail = async (email: string) => {
  const userItem = await db.get({
    TableName: USERS_TABLE,
    Key: {
      email,
    },
  });
  const user = userItem?.Item;
  return user as User | undefined;
};

export const getPortfolioById = async (email: string, id: string) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  const portfolio = user.portfolios.find((portfolio: Portfolio) => portfolio.id === id);
  if (!user.portfolios || !portfolio) {
    throw new HTTPException(404, { message: "Portfolio not found." });
  }
  return portfolio;
};

export const deletePortfolioById = async (email: string, id: string) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  if (!user.portfolios) {
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

  return updatedPortfolios;
};

export const updatePortfolioById = async (
  email: string,
  id: string,
  data: Pick<Portfolio, "name" | "currency">,
) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  const portfolioToUpdate = user.portfolios.find((p: Portfolio) => p.id === id);
  if (!user.portfolios || !portfolioToUpdate) {
    throw new HTTPException(404, { message: "Portfolio not found." });
  }
  // if name in data, verify that a portfolio with the same name does not exist
  if (data.name) {
    const existingPortfolio = user.portfolios.find(
      (p: Portfolio) => p.name === data.name,
    );
    if (existingPortfolio) {
      throw new HTTPException(400, {
        message: "Portfolio with the same name already exists.",
      });
    }
    portfolioToUpdate.name = data.name;
  }
  // if currency in data, verify that it is a valid currency
  const isValidCurrency = !!currencies.find(({ symbol }) => symbol === data.currency);
  if (data.currency && isValidCurrency) {
    portfolioToUpdate.currency = data.currency;
  }
  const updatedPortfolios = user.portfolios.map((p: Portfolio) => {
    if (p.id === id) {
      return portfolioToUpdate;
    }
    return p;
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
  return;
};

export const createPortfolio = async (email: string, data: Portfolio) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  if (!user.portfolios) {
    user.portfolios = [];
  }
  const existingPortfolio = user.portfolios.find((p: Portfolio) => p.name === data.name);
  if (existingPortfolio) {
    throw new HTTPException(400, {
      message: "Portfolio with the same name already exists.",
    });
  }
  user.portfolios.push(data);
  await db.update({
    TableName: USERS_TABLE,
    Key: {
      email,
    },
    UpdateExpression: "SET portfolios = :portfolios",
    ExpressionAttributeValues: {
      ":portfolios": user.portfolios,
    },
  });
  return user.portfolios;
};

export const addPortfolioHolding = async (
  email: string,
  portfolioId: string,
  holding: PortfolioHolding,
) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  const portfolio = user.portfolios.find((p: Portfolio) => p.id === portfolioId);
  if (!user.portfolios || !portfolio) {
    throw new HTTPException(404, { message: "Portfolio not found." });
  }
  if (!portfolio.holdings) {
    portfolio.holdings = [];
  }
  const existingHolding = portfolio.holdings.find(
    (h: PortfolioHolding) => h.symbol === holding.symbol,
  );
  if (existingHolding) {
    throw new HTTPException(400, {
      message: "Holding with the same symbol already exists.",
    });
  }
  // query holding's currency
  const YQ = new YahooQuote();
  const metadata = await YQ.getSymbolDetails(holding.symbol);
  holding.currency = metadata.currency;
  portfolio.holdings.push(holding);
  await db.update({
    TableName: USERS_TABLE,
    Key: {
      email,
    },
    UpdateExpression: "SET portfolios = :portfolios",
    ExpressionAttributeValues: {
      ":portfolios": user.portfolios,
    },
  });
  return portfolio.holdings;
};

export const deletePortfolioHolding = async (
  email: string,
  portfolioId: string,
  symbol: string,
) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  const portfolio = user.portfolios.find((p: Portfolio) => p.id === portfolioId);
  if (!portfolio) {
    throw new HTTPException(404, { message: "Portfolio not found." });
  }
  if (!portfolio.holdings) {
    throw new HTTPException(404, { message: "Holding not found." });
  }
  portfolio.holdings = portfolio.holdings.filter(
    (holding: PortfolioHolding) => holding.symbol !== symbol,
  );
  await db.update({
    TableName: USERS_TABLE,
    Key: {
      email,
    },
    UpdateExpression: "SET portfolios = :portfolios",
    ExpressionAttributeValues: {
      ":portfolios": user.portfolios,
    },
  });
  return;
};

export const addPortfolioTransaction = async (
  email: string,
  portfolioId: string,
  symbol: string,
  transaction: PortfolioTransaction,
) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  const portfolio = user.portfolios.find((p: Portfolio) => p.id === portfolioId);
  if (!user.portfolios || !portfolio) {
    throw new HTTPException(404, { message: "Portfolio not found." });
  }
  const holding = portfolio.holdings.find((h: PortfolioHolding) => h.symbol === symbol);
  if (!portfolio.holdings || !holding) {
    throw new HTTPException(404, { message: "Holding not found." });
  }
  if (!holding.transactions) {
    holding.transactions = [];
  }
  holding.transactions.push(transaction);
  await db.update({
    TableName: USERS_TABLE,
    Key: {
      email,
    },
    UpdateExpression: "SET portfolios = :portfolios",
    ExpressionAttributeValues: {
      ":portfolios": user.portfolios,
    },
  });
  return holding.transactions;
};

export const deletePortfolioTransaction = async (
  email: string,
  portfolioId: string,
  symbol: string,
  transactionId: string,
) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  const portfolio = user.portfolios.find((p: Portfolio) => p.id === portfolioId);
  if (!user.portfolios || !portfolio) {
    throw new HTTPException(404, { message: "Portfolio not found." });
  }
  const holding = portfolio.holdings.find((h: PortfolioHolding) => h.symbol === symbol);
  if (!portfolio.holdings || !holding) {
    throw new HTTPException(404, { message: "Holding not found." });
  }
  if (!holding.transactions) {
    throw new HTTPException(404, { message: "Transaction not found." });
  }
  const updatedTransactions = holding.transactions.filter(
    (transaction: PortfolioTransaction) => transaction.id !== transactionId,
  );
  await db.update({
    TableName: USERS_TABLE,
    Key: {
      email,
    },
    UpdateExpression: "SET portfolios = :portfolios",
    ExpressionAttributeValues: {
      ":portfolios": user.portfolios,
    },
  });
  return updatedTransactions;
};

export const updatePortfolioTransaction = async (
  email: string,
  portfolioId: string,
  symbol: string,
  transactionId: string,
  data: PortfolioTransaction,
) => {
  const user = await getUserByEmail(email);
  if (!user) {
    throw new HTTPException(404, { message: "User not found." });
  }
  const portfolioIndex = user.portfolios.findIndex(
    (p: Portfolio) => p.id === portfolioId,
  );
  if (portfolioIndex === -1) {
    throw new HTTPException(404, { message: "Portfolio not found." });
  }
  const holdingIndex = user.portfolios[portfolioIndex].holdings.findIndex(
    (h: PortfolioHolding) => h.symbol === symbol,
  );
  if (holdingIndex === -1) {
    throw new HTTPException(404, { message: "Holding not found." });
  }
  user.portfolios[portfolioIndex].holdings[holdingIndex].transactions = user.portfolios[
    portfolioIndex
  ].holdings[holdingIndex].transactions.map((transaction: PortfolioTransaction) => {
    if (transaction.id === transactionId) {
      return {
        id: transaction.id,
        time: data.time ?? transaction.time,
        quantity: data.quantity ?? transaction.quantity,
        type: data.type ?? transaction.type,
        price: data.price ?? transaction.price,
      } satisfies PortfolioTransaction;
    }
    return transaction;
  });
  await db.update({
    TableName: USERS_TABLE,
    Key: {
      email,
    },
    UpdateExpression: "SET portfolios = :portfolios",
    ExpressionAttributeValues: {
      ":portfolios": user.portfolios,
    },
  });
};
