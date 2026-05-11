import { getServerSession } from "next-auth";
import { authOptions } from "../auth/[...nextauth]/options";
import { errorResponse } from "../_backend";

export async function GET() {
  const session = await getServerSession(authOptions);
  if (!session) {
    return errorResponse(401, "Unauthorized");
  }

  return errorResponse(501, "Yield endpoint not implemented");
}
