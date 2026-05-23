import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";

export async function POST(
  request: Request,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    console.log("[DELETE API] Starting delete process...");
    
    const session = await getSession();
    if (!session) {
      console.log("[DELETE API] No session found");
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    console.log("[DELETE API] User role:", session.role);
    
    if (session.role !== "MAGS_OFFICER" && session.role !== "ADMIN") {
      console.log("[DELETE API] Forbidden - wrong role");
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const { id } = await params;
    console.log("[DELETE API] Resource ID to delete:", id);

    if (!id) {
      console.log("[DELETE API] No ID provided");
      return NextResponse.json({ error: "Resource ID is required" }, { status: 400 });
    }

    // Check if resource exists
    const resource = await prisma.resource.findUnique({
      where: { id },
    });

    if (!resource) {
      console.log("[DELETE API] Resource not found");
      return NextResponse.json({ error: "Resource not found" }, { status: 404 });
    }

    console.log("[DELETE API] Found resource:", resource.name);
    console.log("[DELETE API] Category:", resource.category);

    // Check if resource is used in any reservations
    const hasReservations = await prisma.reservationEquipment.findFirst({
      where: { resourceId: id },
    });

    if (hasReservations) {
      console.log("[DELETE API] Resource is used in reservations - soft delete only");
      // Soft delete - just mark as inactive
      await prisma.resource.update({
        where: { id },
        data: { isActive: false },
      });
      console.log("[DELETE API] Soft delete successful");
    } else {
      // Hard delete - completely remove if not used
      console.log("[DELETE API] Resource not used in any reservations - hard delete");
      await prisma.resource.delete({
        where: { id },
      });
      console.log("[DELETE API] Hard delete successful");
    }

    return NextResponse.json({ 
      success: true, 
      message: "Resource deleted successfully",
      deleted: true 
    });
    
  } catch (error) {
    console.error("[DELETE API] Error details:", error);
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}