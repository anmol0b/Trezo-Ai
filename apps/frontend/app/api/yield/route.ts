import { NextResponse } from "next/server";
import { yieldMockData } from "../../../lib/mockData";

export async function GET() {
  return NextResponse.json(yieldMockData, { status: 200 });
}
