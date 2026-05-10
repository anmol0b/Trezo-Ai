import { NextResponse } from "next/server";
import { dashboardMockData } from "../../../lib/mockData";

export async function GET() {
  return NextResponse.json(dashboardMockData, { status: 200 });
}
