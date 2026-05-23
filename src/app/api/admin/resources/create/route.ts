import { NextResponse } from "next/server";
import { prisma } from "@/lib/db";
import { getSession } from "@/lib/auth";
import { ResourceCategory } from "@prisma/client";

export async function POST(request: Request) {
  try {
    const session = await getSession();
    if (!session) {
      return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
    }
    
    if (session.role !== "MAGS_OFFICER" && session.role !== "ADMIN") {
      return NextResponse.json({ error: "Forbidden" }, { status: 403 });
    }

    const body = await request.json();
    const { name, description, requiresSpecify, category, quantity } = body;

    if (!name || !category) {
      return NextResponse.json({ error: "Name and category are required" }, { status: 400 });
    }

    // Create base slug
    let baseSlug = name.toLowerCase().replace(/\s+/g, "-");
    let slug = baseSlug;
    let counter = 1;
    
    // Check if slug exists (including ALL records, active and inactive)
    let existing = await prisma.resource.findFirst({
      where: { slug: slug },
    });
    
    // If slug exists, append a number until we find a unique one
    while (existing) {
      slug = `${baseSlug}-${counter}`;
      existing = await prisma.resource.findFirst({
        where: { slug: slug },
      });
      counter++;
    }

    console.log(`[CREATE] Creating equipment with slug: ${slug}`);

    const resource = await prisma.resource.create({
      data: {
        name,
        slug,
        category: category as ResourceCategory,
        description: description || null,
        requiresSpecify: requiresSpecify || false,
        quantity: quantity || 0,
        availableQuantity: quantity || 0,
        isActive: true,
      },
    });

    console.log(`[CREATE] Successfully created: ${resource.name} (${resource.slug})`);
    return NextResponse.json({ success: true, resource }, { status: 201 });
    
  } catch (error) {
    console.error("Error creating resource:", error);
    
    // Check for duplicate error
    if (error instanceof Error && 'code' in error && error.code === 'P2002') {
      return NextResponse.json({ 
        error: "A resource with this name already exists. Please use a different name." 
      }, { status: 400 });
    }
    
    const errorMessage = error instanceof Error ? error.message : "Internal server error";
    return NextResponse.json({ error: errorMessage }, { status: 500 });
  }
}