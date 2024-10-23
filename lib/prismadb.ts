import { PrismaClient } from "@prisma/client";


let prisma: PrismaClient | undefined;


const prismadb = prisma || new PrismaClient();

if(process.env.NODE_ENV !== "production") prisma = prismadb;

export default prismadb;