import { PrismaClient } from "../generated/prisma/client";
import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";

// Geliştirmede her kod değişikliğinde modüller yeniden yüklenir; istemciyi
// globalThis üzerinde saklayarak her seferinde yeni bir bağlantı açılmasını önlüyoruz.
const globalIcin = globalThis as unknown as { prisma?: PrismaClient };

const istemciOlustur = () =>
    new PrismaClient({
        adapter: new PrismaBetterSqlite3({
            url: process.env.DATABASE_URL!,
        }),
    });

const prisma = globalIcin.prisma ?? istemciOlustur();

if (process.env.NODE_ENV !== "production") {
    globalIcin.prisma = prisma;
}

export default prisma;
