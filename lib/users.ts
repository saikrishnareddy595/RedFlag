import bcrypt from "bcryptjs";

/**
 * Demo user store.
 *
 * Accounts live in an in-memory Map seeded at module load. This is intentional
 * for the demo: the seeded accounts always work, and sign-ups succeed within a
 * running server instance. Because Vercel's serverless functions are stateless
 * and ephemeral, newly registered users will NOT persist across cold starts —
 * swap this module for a real database (e.g. Postgres/Prisma) for production.
 */

export interface StoredUser {
  id: string;
  name: string;
  email: string;
  passwordHash: string;
}

export interface PublicUser {
  id: string;
  name: string;
  email: string;
}

const SALT_ROUNDS = 10;

const SEED_USERS: { name: string; email: string; password: string }[] = [
  { name: "Demo User", email: "demo@redflag.app", password: "demo1234" },
  { name: "Sai Krishna", email: "sai@redflag.app", password: "redflag123" },
];

const users = new Map<string, StoredUser>();

for (let i = 0; i < SEED_USERS.length; i++) {
  const u = SEED_USERS[i];
  users.set(u.email.toLowerCase(), {
    id: String(i + 1),
    name: u.name,
    email: u.email,
    passwordHash: bcrypt.hashSync(u.password, SALT_ROUNDS),
  });
}

function toPublic(u: StoredUser): PublicUser {
  return { id: u.id, name: u.name, email: u.email };
}

/** Returns the user matching email/password, or null if credentials are invalid. */
export function verifyCredentials(email: string, password: string): PublicUser | null {
  const user = users.get(email.trim().toLowerCase());
  if (!user) return null;
  return bcrypt.compareSync(password, user.passwordHash) ? toPublic(user) : null;
}

/** Creates a new in-memory user. Throws if the email is already registered. */
export function createUser(name: string, email: string, password: string): PublicUser {
  const key = email.trim().toLowerCase();
  if (users.has(key)) {
    throw new Error("EMAIL_TAKEN");
  }
  const user: StoredUser = {
    id: `u_${Date.now()}`,
    name: name.trim(),
    email: email.trim(),
    passwordHash: bcrypt.hashSync(password, SALT_ROUNDS),
  };
  users.set(key, user);
  return toPublic(user);
}
