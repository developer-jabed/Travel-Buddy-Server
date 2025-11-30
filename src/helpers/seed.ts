import { UserRole } from "@prisma/client";
import * as bcrypt from "bcryptjs";
import config from "../config";
import prisma from "../shared/prisma";

const seedSuperAdmin = async () => {
  try {
    // Check if super admin exists
    const isExistSuperAdmin = await prisma.user.findFirst({
      where: {
        role: UserRole.ADMIN,
        Admin: { isNot: null },
      },
    });

    if (isExistSuperAdmin) {
      console.log("Super admin already exists!");
      return;
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(
      "jabed1780",
      Number(config.salt_round)
    );

    // Create Super Admin User
    const superAdminData = await prisma.user.create({
      data: {
        name: "Jabed Islam",       // ✅ required field for User
        email: "jabed1780@gmail.com",
        password: hashedPassword,
        role: UserRole.ADMIN,
        Admin: {
          create: {
            name: "Jabed Islam",   // ✅ required field for Admin
            superAdmin: true,
            permissions: [
              "MANAGE_USERS",
              "MANAGE_TRIPS",
              "MANAGE_BUDDY_REQUESTS",
              "MANAGE_MEETUPS",
              "VIEW_REPORTS",
              "MANAGE_SUBSCRIPTIONS",
            ],
          },
        },
      },
      include: {
        Admin: true,
      },
    });

    console.log("✅ Super Admin Created Successfully!", superAdminData);
  } catch (err) {
    console.error("❌ Failed to create super admin:", err);
  } finally {
    await prisma.$disconnect();
  }
};

export default seedSuperAdmin;
