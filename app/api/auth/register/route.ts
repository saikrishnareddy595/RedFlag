import { NextResponse } from "next/server";
import { createUser } from "@/lib/users";

export const runtime = "nodejs";

const EMAIL_RE = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

export async function POST(request: Request) {
  let body: { name?: string; email?: string; password?: string };
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid request body." }, { status: 400 });
  }

  const name = (body.name ?? "").trim();
  const email = (body.email ?? "").trim();
  const password = body.password ?? "";

  if (!name || !email || !password) {
    return NextResponse.json(
      { error: "Name, email, and password are all required." },
      { status: 400 },
    );
  }
  if (!EMAIL_RE.test(email)) {
    return NextResponse.json({ error: "Please enter a valid email address." }, { status: 400 });
  }
  if (password.length < 8) {
    return NextResponse.json(
      { error: "Password must be at least 8 characters." },
      { status: 400 },
    );
  }

  try {
    const user = createUser(name, email, password);
    return NextResponse.json({ ok: true, user }, { status: 201 });
  } catch (err) {
    if (err instanceof Error && err.message === "EMAIL_TAKEN") {
      return NextResponse.json(
        { error: "An account with this email already exists." },
        { status: 409 },
      );
    }
    return NextResponse.json({ error: "Could not create your account." }, { status: 500 });
  }
}
