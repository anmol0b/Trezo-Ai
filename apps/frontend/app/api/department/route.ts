import { NextResponse } from "next/server";
import { departmentPageMockData } from "../../../lib/mockData";

export async function GET() {
  return NextResponse.json(departmentPageMockData, { status: 200 });
}
