import { UserRole } from "@prisma/client";
import * as bcrypt from 'bcryptjs';
import config from "../config";
import prisma from "../shared/prisma";


const seedSuperAdmin = async () => {
    try {
        const isExistSuperAdmin = await prisma.user.findFirst({
            where: {
                role: UserRole.ADMIN
            }
        });

        if (isExistSuperAdmin) {
            console.log("Super admin already exists!")
            return;
        };

        const hashedPassword = await bcrypt.hash("jabed1780", Number(config.salt_round))

        const superAdminData = await prisma.user.create({
            data: {
                email: "jabed1780@gmail.com",
                password: hashedPassword,
                role: UserRole.ADMIN,
                admin: {
                    create: {
                        name: "Jabed Islam",
                        //email: "super@admin.com",
                        contactNumber: "01893292965"
                    }
                }
            }
        });

        console.log("Super Admin Created Successfully!", superAdminData);
    }
    catch (err) {
        console.error(err);
    }
    finally {
        await prisma.$disconnect();
    }
};

export default seedSuperAdmin;