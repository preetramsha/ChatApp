import * as dbc from "../db/dbconfig.js";
import jwt from "@tsndr/cloudflare-worker-jwt";
import { Hono } from "hono";
import "dotenv/config";
const auth = new Hono();

auth.post("/signup", async (c) => {
  try {
    const { name, username, password } = await c.req.json();
    if (!name || !username || !password) {
      return c.json({ ok: false, error: "Missing required fields" }, 400);
    }

    const user = await dbc.insertUser(name, username, password);
    const token = await jwt.sign(user, process.env.jwtsecret);
    return c.json({
      ok: true,
      message: "User created successfully",
      user,
      token,
    });
  } catch (error) {
    return c.json({ ok: false, error: error.message }, 200);
  }
});

auth.post("/login", async (c) => {
  try {
    const { username, password } = await c.req.json();
    const user = await dbc.validateUser(username, password);
    if (!user) {
      return c.json({ ok: false, error: "Invalid email or password" }, 401);
    }
    const token = await jwt.sign(user, process.env.jwtsecret);
    if (!token) {
      return c.json({ ok: false, error: "Failed to generate token" }, 401);
    }
    return c.json({ ok: true, token });
  } catch (error) {
    return c.json({ ok: false, error: error.message }, 200);
  }
});

export default auth;
