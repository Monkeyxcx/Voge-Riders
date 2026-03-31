import { describe, expect, it } from "vitest";
import { canEditComment } from "@/features/comments/commentsRepo";

describe("canEditComment", () => {
  it("returns false when user is null", () => {
    expect(canEditComment("u1", null)).toBe(false);
  });

  it("returns false when user is undefined", () => {
    expect(canEditComment("u1", undefined)).toBe(false);
  });

  it("returns false when ids differ", () => {
    expect(canEditComment("u1", "u2")).toBe(false);
  });

  it("returns true when ids match", () => {
    expect(canEditComment("u1", "u1")).toBe(true);
  });
});

