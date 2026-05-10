import { NextResponse } from "next/server";
import { invoicesMockData } from "../../../lib/mockData";

export async function GET() {
  return NextResponse.json(invoicesMockData, { status: 200 });
}

