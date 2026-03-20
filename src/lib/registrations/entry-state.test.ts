import { describe, expect, it } from "vitest";
import { getRegistrationEntryState } from "@/lib/registrations/entry-state";

describe("registration entry state", () => {
  it("prioritizes existing registrations", () => {
    expect(
      getRegistrationEntryState({
        currentRegistrationStatus: "ACCEPTED",
        isAuthenticated: true,
        registrationOpen: true,
        authReady: true,
      })
    ).toEqual({ kind: "existing", status: "ACCEPTED" });
  });

  it("allows authenticated users including admins to register during the window", () => {
    expect(
      getRegistrationEntryState({
        isAuthenticated: true,
        registrationOpen: true,
        authReady: true,
      })
    ).toEqual({ kind: "can_register" });
  });

  it("requires login for anonymous visitors during the window", () => {
    expect(
      getRegistrationEntryState({
        isAuthenticated: false,
        registrationOpen: true,
        authReady: true,
      })
    ).toEqual({ kind: "login_required" });
  });

  it("surfaces auth unavailable and closed states", () => {
    expect(
      getRegistrationEntryState({
        isAuthenticated: false,
        registrationOpen: true,
        authReady: false,
      })
    ).toEqual({ kind: "auth_unavailable" });

    expect(
      getRegistrationEntryState({
        isAuthenticated: true,
        registrationOpen: false,
        authReady: true,
      })
    ).toEqual({ kind: "closed" });
  });
});
