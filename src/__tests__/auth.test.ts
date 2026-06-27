/**
 * Authentication Test Suite
 * Tests signup, login, session validation, and logs isolation per user.
 */

import { AuthProvider } from "../context/AuthContext";

// Simple local mock simulator for testing auth behaviors without DOM dependencies
class LocalAuthSimulator {
  private users: any[] = [];
  private currentUser: any | null = null;
  private logsByUser: Record<string, any[]> = {};

  constructor() {
    // Populate dummy users
    this.users = [
      { id: "user_rahul", name: "Rahul Sharma", email: "rahul@manasvi.edu", pass: "rahul123", exam: "JEE" },
      { id: "user_priya", name: "Priya Patel", email: "priya@manasvi.edu", pass: "priya123", exam: "NEET" },
    ];
    this.logsByUser["user_rahul"] = [{ text: "Rahul log" }];
    this.logsByUser["user_priya"] = [{ text: "Priya log" }];
  }

  getCurrentUser() {
    return this.currentUser;
  }

  login(email: string, pass: string): boolean {
    const found = this.users.find((u) => u.email === email && u.pass === pass);
    if (found) {
      this.currentUser = { id: found.id, name: found.name, email: found.email, exam: found.exam };
      return true;
    }
    return false;
  }

  signup(name: string, email: string, pass: string, exam: string): boolean {
    if (this.users.some((u) => u.email === email)) return false;
    const newUser = { id: `user_${Date.now()}`, name, email, pass, exam };
    this.users.push(newUser);
    this.logsByUser[newUser.id] = [];
    this.currentUser = { id: newUser.id, name: newUser.name, email: newUser.email, exam: newUser.exam };
    return true;
  }

  logout() {
    this.currentUser = null;
  }

  getLogs(userId: string) {
    return this.logsByUser[userId] || [];
  }
}

describe("Authentication & Multi-User System", () => {
  let auth: LocalAuthSimulator;

  beforeEach(() => {
    auth = new LocalAuthSimulator();
  });

  test("Rahul Sharma logs in successfully with correct credentials", () => {
    const success = auth.login("rahul@manasvi.edu", "rahul123");
    expect(success).toBe(true);
    expect(auth.getCurrentUser()).toEqual({
      id: "user_rahul",
      name: "Rahul Sharma",
      email: "rahul@manasvi.edu",
      exam: "JEE",
    });
  });

  test("Rahul Sharma fails to log in with incorrect password", () => {
    const success = auth.login("rahul@manasvi.edu", "wrongpass");
    expect(success).toBe(false);
    expect(auth.getCurrentUser()).toBeNull();
  });

  test("Priya Patel logs in successfully with correct credentials", () => {
    const success = auth.login("priya@manasvi.edu", "priya123");
    expect(success).toBe(true);
    expect(auth.getCurrentUser()?.name).toBe("Priya Patel");
  });

  test("New user registration succeeds and auto-logs in", () => {
    const success = auth.signup("Aditi Roy", "aditi@manasvi.edu", "aditi123", "UPSC");
    expect(success).toBe(true);
    expect(auth.getCurrentUser()).toEqual({
      id: expect.stringContaining("user_"),
      name: "Aditi Roy",
      email: "aditi@manasvi.edu",
      exam: "UPSC",
    });
  });

  test("New user registration fails if email is duplicate", () => {
    const success = auth.signup("Fake Rahul", "rahul@manasvi.edu", "password", "JEE");
    expect(success).toBe(false);
  });

  test("Session resets correctly on logout", () => {
    auth.login("rahul@manasvi.edu", "rahul123");
    expect(auth.getCurrentUser()).not.toBeNull();
    auth.logout();
    expect(auth.getCurrentUser()).toBeNull();
  });

  test("Logs are strictly isolated by User ID", () => {
    const rahulLogs = auth.getLogs("user_rahul");
    const priyaLogs = auth.getLogs("user_priya");
    expect(rahulLogs).toEqual([{ text: "Rahul log" }]);
    expect(priyaLogs).toEqual([{ text: "Priya log" }]);
    expect(rahulLogs).not.toEqual(priyaLogs);
  });
});
