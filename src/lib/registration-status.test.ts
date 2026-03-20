import { describe, expect, it } from "vitest";
import {
  canCancelRegistration,
  canConfirmRegistration,
  canTransition,
  getAvailableTransitions,
  getRegistrationStatusLabel,
  isRegistrationStatus,
} from "@/lib/registration-status";

describe("registration status", () => {
  it("exposes the allowed transitions", () => {
    expect(getAvailableTransitions("PENDING")).toEqual(["ACCEPTED", "REJECTED"]);
    expect(getAvailableTransitions("ACCEPTED")).toEqual(["CONFIRMED", "CANCELLED"]);
    expect(getAvailableTransitions("CONFIRMED")).toEqual(["CANCELLED"]);
  });

  it("blocks invalid transitions", () => {
    expect(canTransition("PENDING", "CONFIRMED")).toBe(false);
    expect(canTransition("REJECTED", "CANCELLED")).toBe(false);
  });

  it("exposes user-facing helpers", () => {
    expect(canConfirmRegistration("ACCEPTED")).toBe(true);
    expect(canConfirmRegistration("PENDING")).toBe(false);
    expect(canCancelRegistration("CONFIRMED")).toBe(true);
    expect(canCancelRegistration("PENDING")).toBe(false);
  });

  it("returns labels and type guards", () => {
    expect(getRegistrationStatusLabel("PENDING")).toBe("待审核");
    expect(isRegistrationStatus("ACCEPTED")).toBe(true);
    expect(isRegistrationStatus("OTHER")).toBe(false);
  });
});
