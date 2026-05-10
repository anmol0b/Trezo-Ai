import { NextResponse } from "next/server";
import { auditMockData } from "../../../lib/mockData";

export async function GET() {
  return NextResponse.json(auditMockData, { status: 200 });
}
