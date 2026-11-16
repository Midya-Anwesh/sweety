import request from "supertest";
import { expect, it } from "vitest";
import { app, addReading, createLoggedInUser } from "./helpers";

it("creates, retrieves, edits, lists, and deletes a reading", async () => {
  const { token } = await createLoggedInUser();
  const created = await addReading(token);
  expect(created.status).toBe(201);
  const id = created.body.reading.id;
  expect(
    (
      await request(app)
        .get(`/api/readings/${id}`)
        .auth(token, { type: "bearer" })
    ).status,
  ).toBe(200);
  const updated = await request(app)
    .patch(`/api/readings/${id}`)
    .auth(token, { type: "bearer" })
    .send({ value: 125 });
  expect(updated.status).toBe(200);
  expect(updated.body.reading.value).toBe(125);
  const list = await request(app)
    .get("/api/readings?date=2026-01-15")
    .auth(token, { type: "bearer" });
  expect(list.body.readings).toHaveLength(1);
  expect(
    (
      await request(app)
        .delete(`/api/readings/${id}`)
        .auth(token, { type: "bearer" })
    ).status,
  ).toBe(204);
  expect(
    (
      await request(app)
        .get(`/api/readings/${id}`)
        .auth(token, { type: "bearer" })
    ).status,
  ).toBe(404);
});

it("rejects missing, null, decimal, string, and out-of-range glucose values", async () => {
  const { token } = await createLoggedInUser();
  for (const value of [undefined, null, 39, 601, 100.5, "100"]) {
    const result = await addReading(token, { value });
    expect(result.status, `invalid value ${value}`).toBe(400);
    expect(result.body.message).toEqual(expect.any(String));
  }
  expect((await addReading(token, { value: 40 })).status).toBe(201);
  expect(
    (await addReading(token, { value: 600, slot: "after_lunch" })).status,
  ).toBe(201);
});

it("rejects future/invalid dates, unsupported slots, and request-supplied ownership", async () => {
  const { token } = await createLoggedInUser();
  for (const date of ["2999-01-01", "2026-02-30", "15-01-2026", "not-a-date"]) {
    expect((await addReading(token, { date })).status).toBe(400);
  }
  expect((await addReading(token, { slot: "snack" })).status).toBe(400);
  expect((await addReading(token, { userId: "another-user" })).status).toBe(
    400,
  );
});

it("enforces one slot per day, including simultaneous requests and a fifth reading", async () => {
  const { token } = await createLoggedInUser();
  const attempts = await Promise.all([addReading(token), addReading(token)]);
  expect(attempts.map((response) => response.status).sort()).toEqual([
    201, 409,
  ]);
  for (const slot of ["after_breakfast", "after_lunch", "after_dinner"]) {
    expect((await addReading(token, { slot })).status).toBe(201);
  }
  expect((await addReading(token)).status).toBe(409);
  const list = await request(app)
    .get("/api/readings")
    .auth(token, { type: "bearer" });
  expect(list.body.readings).toHaveLength(4);
});

it("prevents another patient or self-registered doctor accessing a user’s readings", async () => {
  const owner = await createLoggedInUser();
  const created = await addReading(owner.token);
  const url = `/api/readings/${created.body.reading.id}`;
  for (const role of ["patient", "doctor"] as const) {
    const other = await createLoggedInUser(role);
    expect(
      (await request(app).get(url).auth(other.token, { type: "bearer" }))
        .status,
    ).toBe(404);
    expect(
      (
        await request(app)
          .patch(url)
          .auth(other.token, { type: "bearer" })
          .send({ value: 150 })
      ).status,
    ).toBe(404);
    expect(
      (await request(app).delete(url).auth(other.token, { type: "bearer" }))
        .status,
    ).toBe(404);
    const list = await request(app)
      .get("/api/readings")
      .auth(other.token, { type: "bearer" });
    expect(list.body.readings).toEqual([]);
  }
});
