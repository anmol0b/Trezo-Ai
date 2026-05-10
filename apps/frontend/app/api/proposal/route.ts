import { NextResponse } from "next/server";
import { proposalMockData } from "../../../lib/mockData";

export async function GET() {
  return NextResponse.json(proposalMockData, { status: 200 });
}
