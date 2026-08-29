const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

const request = require("supertest");
const app = require("../src/app");
const User = require("../src/models/User");
const Team = require("../src/models/Team");
const { connectTestDB, disconnectTestDB } = require("./setup");

beforeAll(async () => { await connectTestDB(); });
afterAll(async () => { await disconnectTestDB(); });

jest.mock("../src/utils/mailer", () => ({
  sendEmail: jest.fn().mockResolvedValue(undefined),
}));

jest.mock("express-rate-limit", () => () => (req, res, next) => next());

const TEST_USER = {
  email: "teamuser@example.com",
  password: "Test@1234",
  confirmPassword: "Test@1234",
  displayName: "TeamUser",
};

const VALID_TEAM_PAYLOAD = {
  teamData: {
    teamTitle: "Test Team",
    teamSize: 4,
    team: [
      { slug: "kasel", name: "Kasel", role: "Knight" },
      null,
      null,
      null,
    ],
    subSlots: [
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
      [null, null, null, null],
    ],
    subStars: [
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
      [0, 0, 0, 0],
    ],
    perks: [null, null, null, null],
    advancements: [null, null, null, null],
    isPublic: true,
    tags: [],
  },
};

// Helper: register, verify, and log in a user — returns cookie string
async function loginUser() {
  await request(app).post("/api/v2/auth/register").send(TEST_USER);
  await User.findOneAndUpdate(
    { email: TEST_USER.email },
    { emailVerified: true }
  );
  const res = await request(app).post("/api/v2/auth/login").send({
    email: TEST_USER.email,
    password: TEST_USER.password,
  });
  return res.headers["set-cookie"];
}

beforeEach(async () => {
  await User.deleteMany({});
  await Team.deleteMany({});
});

describe("POST /api/v2/teams", () => {
  it("returns 401 when not authenticated", async () => {
    const res = await request(app).post("/api/v2/teams").send(VALID_TEAM_PAYLOAD);
    expect(res.status).toBe(401);
  });

  it("returns 201 and creates a team when authenticated", async () => {
    const cookies = await loginUser();
    const res = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send(VALID_TEAM_PAYLOAD);
    expect(res.status).toBe(201);
    expect(res.body.success).toBe(true);
    expect(res.body.team.name).toBe("Test Team");
  });

  it("returns 400 when teamData is missing", async () => {
    const cookies = await loginUser();
    const res = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send({});
    expect(res.status).toBe(400);
    expect(res.body.success).toBe(false);
  });
});

describe("GET /api/v2/teams/:identifier", () => {
  it("returns a public team by slug", async () => {
    const cookies = await loginUser();
    const createRes = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send(VALID_TEAM_PAYLOAD);
    const slug = createRes.body.team.slug;

    const res = await request(app).get(`/api/v2/teams/${slug}`);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.team.slug).toBe(slug);
  });

  it("returns 403 for a private team when not the author", async () => {
    const cookies = await loginUser();
    const privatePayload = {
      teamData: { ...VALID_TEAM_PAYLOAD.teamData, isPublic: false },
    };
    const createRes = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send(privatePayload);
    const slug = createRes.body.team.slug;

    const res = await request(app).get(`/api/v2/teams/${slug}`);
    expect(res.status).toBe(403);
  });

  it("returns 404 for a non-existent team", async () => {
    const res = await request(app).get("/api/v2/teams/this-slug-does-not-exist");
    expect(res.status).toBe(404);
  });
});

describe("PATCH /api/v2/teams/:slug", () => {
  it("updates a team when authenticated as the author", async () => {
    const cookies = await loginUser();
    const createRes = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send(VALID_TEAM_PAYLOAD);
    const slug = createRes.body.team.slug;

    const res = await request(app)
      .patch(`/api/v2/teams/${slug}`)
      .set("Cookie", cookies)
      .send({
        teamData: { ...VALID_TEAM_PAYLOAD.teamData, teamTitle: "Updated Team" },
      });
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
    expect(res.body.team.name).toBe("Updated Team");
  });

  it("returns 401 when not authenticated", async () => {
    const cookies = await loginUser();
    const createRes = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send(VALID_TEAM_PAYLOAD);
    const slug = createRes.body.team.slug;

    const res = await request(app)
      .patch(`/api/v2/teams/${slug}`)
      .send({ teamData: VALID_TEAM_PAYLOAD.teamData });
    expect(res.status).toBe(401);
  });
});

describe("DELETE /api/v2/teams/:id", () => {
  it("deletes a team when authenticated as the author", async () => {
    const cookies = await loginUser();
    const createRes = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send(VALID_TEAM_PAYLOAD);
    const teamId = createRes.body.teamId;

    const res = await request(app)
      .delete(`/api/v2/teams/${teamId}`)
      .set("Cookie", cookies);
    expect(res.status).toBe(200);
    expect(res.body.success).toBe(true);
  });

  it("returns 401 when not authenticated", async () => {
    const cookies = await loginUser();
    const createRes = await request(app)
      .post("/api/v2/teams")
      .set("Cookie", cookies)
      .send(VALID_TEAM_PAYLOAD);
    const teamId = createRes.body.teamId;

    const res = await request(app).delete(`/api/v2/teams/${teamId}`);
    expect(res.status).toBe(401);
  });
});
