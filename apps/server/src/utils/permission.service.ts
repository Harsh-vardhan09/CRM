import { prisma } from "../config/db";
import { redis } from "../utils/redis.service";


const CACHE_PREFIX = "permissions:";

export async function resolveUserPermissions(userId: number) {

  const cacheKey = `${CACHE_PREFIX}${userId}`;
  const cached = await redis.get(cacheKey);

  if (cached) {
    return JSON.parse(cached);
  }

  const user = await prisma.user.findUnique({
    where: { id: userId },
    include: {
      role: {
        include: {
          permissions: {
            include: {
              feature: true,
            },
          },
        },
      },
    },
  });

  if (!user || !user.role) return {};

  const permissions: Record<string, string> = {};

  user.role.permissions.forEach((permission) => {
    permissions[permission.feature.code] = permission.accessLevel;
  });
  

  await redis.set(cacheKey, JSON.stringify(permissions), "EX", 60 * 60);
  return permissions;
}