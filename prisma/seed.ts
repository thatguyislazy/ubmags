import { PrismaClient, UserRole, ResourceCategory } from "@prisma/client";
import bcrypt from "bcryptjs";
import { DEPARTMENTS } from "../src/lib/constants";

const prisma = new PrismaClient();

const venues = [
  { name: "Auditorium (Tiered Hall)", slug: "auditorium", sortOrder: 1 },
  { name: "Gymnasium", slug: "gymnasium", sortOrder: 2 },
  { name: "Multi Media Center", slug: "multi-media-center", sortOrder: 3 },
  { name: "CAB Conference Room", slug: "cab-conference-room", sortOrder: 4 },
  { name: "Function Hall (Multipurpose Hall / MPH)", slug: "function-hall-mph", sortOrder: 5 },
  { name: "UB Chapel", slug: "ub-chapel", sortOrder: 6 },
  { name: "Learning Resource Center (Library)", slug: "learning-resource-center", sortOrder: 7 },
  { name: "Air Conditioned Rooms", slug: "air-conditioned-rooms", requiresSpecify: true, sortOrder: 8 },
  { name: "Conference Room", slug: "conference-room", sortOrder: 9 },
  { name: "IE Lab", slug: "ie-lab", sortOrder: 10 },
  { name: "CPE Lab", slug: "cpe-lab", sortOrder: 11 },
  { name: "Tiered Hall", slug: "tiered-hall", sortOrder: 12 },
  { name: "Others", slug: "others-venue", requiresSpecify: true, sortOrder: 99 },
];

const equipment = [
  { name: "Microphone", quantity: 10 },
  { name: "Sound System", quantity: 3 },
  { name: "Projector", quantity: 5 },
  { name: "Tables", quantity: 20 },
  { name: "Chairs", quantity: 50 },
  { name: "Podium", quantity: 2 },
  { name: "Extension Cords", quantity: 15 },
];

const services = ["Tech Team", "Maintenance"];

async function main() {
  console.log("Seeding MAGS database...");

  for (const dept of DEPARTMENTS) {
    await prisma.department.upsert({
      where: { code: dept.code },
      update: { name: dept.name },
      create: { code: dept.code, name: dept.name },
    });
  }

  const citec = await prisma.department.findUnique({ where: { code: "CITEC" } });
  if (!citec) throw new Error("CITEC department not found");

  // Seed Venues
  for (const v of venues) {
    await prisma.resource.upsert({
      where: { slug: v.slug },
      update: { name: v.name, sortOrder: v.sortOrder },
      create: {
        name: v.name,
        slug: v.slug,
        category: ResourceCategory.VENUE,
        requiresSpecify: v.requiresSpecify ?? false,
        sortOrder: v.sortOrder,
        isActive: true,
      },
    });
  }

  // Seed Equipment with quantities
  for (let i = 0; i < equipment.length; i++) {
    const item = equipment[i];
    const slug = item.name.toLowerCase().replace(/\s+/g, "-");
    await prisma.resource.upsert({
      where: { slug },
      update: { 
        name: item.name,
        quantity: item.quantity,
        availableQuantity: item.quantity,
      },
      create: {
        name: item.name,
        slug,
        category: ResourceCategory.EQUIPMENT,
        quantity: item.quantity,
        availableQuantity: item.quantity,
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }

  // Seed Services
  for (let i = 0; i < services.length; i++) {
    const name = services[i];
    const slug = name.toLowerCase().replace(/\s+/g, "-");
    await prisma.resource.upsert({
      where: { slug },
      update: { name },
      create: {
        name,
        slug,
        category: ResourceCategory.SERVICE,
        sortOrder: i + 1,
        isActive: true,
      },
    });
  }

  const hash = async (pw: string) => bcrypt.hash(pw, 12);

  const users: Array<{
    email: string;
    name: string;
    password: string;
    role: UserRole;
    departmentId: string;
    studentNumber?: string;
    course?: string;
  }> = [
    {
      email: "admin@ub.edu.ph",
      name: "Admin",
      password: "Admin@123",
      role: "ADMIN",
      departmentId: citec.id,
    },
    {
      email: "mags@ub.edu.ph",
      name: "Editha E. Sevilleja",
      password: "Mags@123",
      role: "MAGS_OFFICER",
      departmentId: citec.id,
    },
    {
      email: "depthead@ub.edu.ph",
      name: "CITEC Department Head",
      password: "Dept@123",
      role: "DEPT_HEAD",
      departmentId: citec.id,
    },
    {
      email: "faculty@ub.edu.ph",
      name: "sample teacher",
      password: "Faculty@123",  // Fixed: Added password
      role: "FACULTY",
      departmentId: citec.id,
    },
    {
      email: "student@ub.edu.ph",
      name: "sample student",
      password: "Student@123",
      role: "STUDENT",
      departmentId: citec.id,
      studentNumber: "2021-12345",
      course: "BS Information Technology",
    },
    {
      email: "staff@ub.edu.ph",
      name: "sample staff",
      password: "Staff@123",
      role: "STAFF",
      departmentId: citec.id,
    },
  ];

  for (const u of users) {
    await prisma.user.upsert({
      where: { email: u.email },
      update: {},
      create: {
        email: u.email,
        name: u.name,
        passwordHash: await hash(u.password),
        role: u.role,
        departmentId: u.departmentId,
        studentNumber: u.studentNumber,
        course: u.course,
        emailVerified: new Date(),
        isActive: true,
      },
    });
  }

  console.log("Seed completed.");
  console.log("Demo logins:");
  users.forEach((u) => console.log(`  ${u.email} / ${u.password}`));
}

main()
  .catch((e) => {
    console.error(e);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());