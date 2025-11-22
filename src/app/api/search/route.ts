import { NextResponse } from "next/server";
import { users } from "@/data/user";

export async function GET(req: Request) {
  const { searchParams } = new URL(req.url);
  const q = searchParams.get("q")?.toLowerCase() || "";

  if (!q.trim()) return NextResponse.json([]);

  const results = users.filter((user) =>
    user.username.toLowerCase().includes(q)
  );

  return NextResponse.json(results);
}
