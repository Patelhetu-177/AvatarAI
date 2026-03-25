import { NextRequest } from "next/server";
import prismadb from "@/lib/prismadb";
import { auth } from "@clerk/nextjs/server";

export async function POST(req: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();

    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { userId, action, details, url, date } = await req.json();

    if (userId !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    if (!userId || !action || !url) {
      return new Response(
        JSON.stringify({ error: "Missing required fields" }),
        { status: 400 },
      );
    }
    const record = await prismadb.transformationHistory.create({
      data: {
        userId,
        action,
        details,
        url,
        date,
      },
    });
    return new Response(JSON.stringify(record), { status: 200 });
  } catch (error) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
    });
  }
}

export async function GET(req: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();

    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(req.url!);
    const userId = searchParams.get("userId");

    if (userId !== authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 403,
      });
    }

    if (!userId) {
      return new Response(JSON.stringify({ error: "Missing userId" }), {
        status: 400,
      });
    }

    try {
      const history = await prismadb.transformationHistory.findMany({
        where: { userId },
        orderBy: [
          { likedAt: { sort: "desc", nulls: "last" } },
          { date: "desc" },
        ],
      });
      return new Response(JSON.stringify(history), { status: 200 });
    } catch (dbError) {
      if (dbError instanceof Error) {
        console.warn("Database unavailable:", dbError.message);
      }
      return new Response(JSON.stringify([]), { status: 200 });
    }
  } catch (error: unknown) {
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
    });
  }
}

export async function DELETE(req: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();

    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { searchParams } = new URL(req.url);
    const id = searchParams.get("id");

    if (!id) {
      return new Response(JSON.stringify({ error: "id required" }), {
        status: 400,
      });
    }

    try {
      const item = await prismadb.transformationHistory.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!item) {
        return new Response(JSON.stringify({ error: "Item not found" }), {
          status: 404,
        });
      }

      if (item.userId !== authenticatedUserId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
        });
      }

      await prismadb.transformationHistory.delete({
        where: { id },
      });
      return new Response(JSON.stringify({ success: true }), { status: 200 });
    } catch (dbError) {
      if (dbError instanceof Error) {
        console.warn("Database unavailable:", dbError.message);
      }
      return new Response(
        JSON.stringify({ success: false, error: "Database unavailable" }),
        { status: 503 },
      );
    }
  } catch (error: unknown) {
    console.error("Delete error:", error);
    if (error instanceof Error) {
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
    });
  }
}

export async function PATCH(req: NextRequest) {
  try {
    const { userId: authenticatedUserId } = await auth();

    if (!authenticatedUserId) {
      return new Response(JSON.stringify({ error: "Unauthorized" }), {
        status: 401,
      });
    }

    const { id, like } = await req.json();

    if (!id) {
      return new Response(JSON.stringify({ error: "id required" }), {
        status: 400,
      });
    }

    try {
      const item = await prismadb.transformationHistory.findUnique({
        where: { id },
        select: { userId: true },
      });

      if (!item) {
        return new Response(JSON.stringify({ error: "Item not found" }), {
          status: 404,
        });
      }

      if (item.userId !== authenticatedUserId) {
        return new Response(JSON.stringify({ error: "Unauthorized" }), {
          status: 403,
        });
      }

      const record = await prismadb.transformationHistory.update({
        where: { id },
        data: {
          likedAt: like ? new Date() : null,
        },
      });
      return new Response(JSON.stringify(record), { status: 200 });
    } catch (dbError) {
      if (dbError instanceof Error) {
        console.warn("Database unavailable:", dbError.message);
      }
      return new Response(
        JSON.stringify({ success: false, error: "Database unavailable" }),
        { status: 503 },
      );
    }
  } catch (error) {
    if (error instanceof Error) {
      console.error("Like error:", error);
      return new Response(JSON.stringify({ error: error.message }), {
        status: 500,
      });
    }
    return new Response(JSON.stringify({ error: "Unknown error" }), {
      status: 500,
    });
  }
}
