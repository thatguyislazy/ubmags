import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function PUT(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.role !== "MAGS_OFFICER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    const body = await request.json();
    const { name, description, requiresSpecify, sortOrder, category } = body;

    if (!name) {
      return NextResponse.json({ error: "Name is required" }, { status: 400 });
    }

    const slug = name.toLowerCase().replace(/\s+/g, "-");

    const resource = await prisma.resource.update({
      where: { id },
      data: {
        name,
        slug,
        description,
        requiresSpecify: requiresSpecify || false,
        sortOrder: sortOrder || 0,
        category,
      },
    });

    return NextResponse.json({ success: true, resource });
    
  } catch (error) {
    console.error("Error updating resource:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}