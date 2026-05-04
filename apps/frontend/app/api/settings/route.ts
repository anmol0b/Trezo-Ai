import { NextResponse } from "next/server";
import { dashboardMockData } from "../../../lib/mockData";

export async function GET() {
  const settings = dashboardMockData.settings;
  if (!settings) {
    return NextResponse.json({ error: "Settings payload not configured" }, { status: 500 });
  }
  return NextResponse.json(settings, { status: 200 });
}
