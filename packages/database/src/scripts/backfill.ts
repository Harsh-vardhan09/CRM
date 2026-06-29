import "dotenv/config";
import { prisma } from "../index.js";

async function backfill() {
  console.log("Running backfill: updating existing users to active status...");
  
  if (!process.env.DATABASE_URL) {
    console.error("Error: DATABASE_URL is not set in the environment.");
    process.exit(1);
  }

  try {
    const result = await prisma.user.updateMany({
      where: {
        status: "pending",
      },
      data: {
        status: "active",
      },
    });
    console.log(`Successfully updated ${result.count} users to active status.`);
  } catch (error) {
    console.error("Error during backfill:", error);
    process.exit(1);
  } finally {
    // Explicitly disconnect Prisma to prevent hanging Node process
    await prisma.$disconnect();
    process.exit(0);
  }
}

backfill();
