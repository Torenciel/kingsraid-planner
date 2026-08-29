const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const { connectTestDB, disconnectTestDB } = require("./setup");

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

// Mock email so no real emails are sent during tests
jest.mock("../src/utils/mailer", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

// Disable rate limiting so tests don't get blocked after repeated requests
jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const TEST_USER = {
  email: "test@example.com",
  password: "Test@1234",
  confirmPassword: "Test@1234",
  displayName: "TestUser",
};

beforeEach(async () => {
  await User.deleteMany({});
});

describe("POST /api/v2/auth/register", () => {
  it("returns 201 and success message on valid registration", async () => {
    const res = await request(app).post("/api/v2/auth/register").send(TEST_USER);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
  });

  it("returns 400 when a required field is missing", async () => {
    const res = await request(app).post("/api/v2/auth/register").send({
      email: "test@example.com",
      password: "Test@1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when passwords do not match", async () => {
    const res = await request(app).post("/api/v2/auth/register").send({
      ...TEST_USER,
      confirmPassword: "Different@1234",
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });

  it("returns 409 when email is already registered", async () => {
    await request(app).post("/api/v2/auth/register").send(TEST_USER);
    const res = await request(app).post("/api/v2/auth/register").send(TEST_USER);
    expect(res.status).toBe(409);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v2/auth/login", () => {
  beforeEach(async () => {
    // Register and verify a user so login can succeed
    await request(app).post("/api/v2/auth/register").send(TEST_USER);
    await User.findOneAndUpdate(
      { email: TEST_USER.email },
      { emailVerified: true }
    );
  });

  it("returns 200 and sets cookies on valid credentials", async () => {
    const res = await request(app).post("/api/v2/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.user.email).toBe(TEST_USER.email);
    const cookies = res.headers["set-cookie"];
    expect(cookies).toBeDefined();
    expect(cookies.some((c) => c.startsWith("accessToken"))).toBe(true);
    expect(cookies.some((c) => c.startsWith("refreshToken"))).toBe(true);
  });

  it("returns 401 on wrong password", async () => {
    const res = await request(app).post("/api/v2/auth/login").send({
      email: TEST_USER.email,
      password: "WrongPassword@1",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 401 on unknown email", async () => {
    const res = await request(app).post("/api/v2/auth/login").send({
      email: "nobody@example.com",
      password: "Test@1234",
    });
    expect(res.status).toBe(401);
    expect(res.body.success).toBe(false);
  });

  it("returns 403 when email is not verified", async () => {
    await User.findOneAndUpdate(
      { email: TEST_USER.email },
      { emailVerified: false }
    );
    const res = await request(app).post("/api/v2/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(res.status).toBe(403);
    expect(res.body.success).toBe(false);
  });

  it("returns 400 when fields are missing", async () => {
    const res = await request(app).post("/api/v2/auth/login").send({
      email: TEST_USER.email,
    });
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("POST /api/v2/auth/logout", () => {
  it("returns 200 and clears cookies", async () => {
    const res = await request(app).post("/api/v2/auth/logout");
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });
});

describe("GET /api/v2/auth/me", () => {
  it("returns 401 when no token is provided", async () => {
    const res = await request(app).get("/api/v2/auth/me");
    expect(res.status).toBe(401);
  });

  it("returns user data when authenticated", async () => {
    await User.deleteMany({});
    await request(app).post("/api/v2/auth/register").send(TEST_USER);
    await User.findOneAndUpdate(
      { email: TEST_USER.email },
      { emailVerified: true }
    );
    const loginRes = await request(app).post("/api/v2/auth/login").send({
      email: TEST_USER.email,
      password: TEST_USER.password,
    });
    expect(loginRes.status).toBe(200);
    const cookies = loginRes.headers["set-cookie"];

    const res = await request(app)
      .get("/api/v2/auth/me")
      .set("Cookie", cookies);

    expect(res.status).toBe(200);
    expect(res.body.authenticated).toBe(true);
    expect(res.body.user.email).toBe(TEST_USER.email);
  });
});
