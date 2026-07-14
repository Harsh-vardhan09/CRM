import type { Request, Response } from 'express';
import { prisma } from '@repo/db';

export const getActiveTeam = async (req: Request, res: Response) => {
  try {
    const user = req.user;
    if (!user || !user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const team = await prisma.user.findMany({
      where: {
        companyId: user.companyId,
        status: 'active'
      },
      select: {
        id: true,
        name: true,
        email: true,
        status: true,
        lastLoginAt: true,
        role: {
          select: {
            id: true,
            name: true
          }
        }
      },
      orderBy: {
        name: 'asc'
      }
    });

    return res.status(200).json(team);
  } catch (error) {
    console.error('Error fetching active team:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};

export const assignUserRole = async (req: Request, res: Response) => {
  try {
    const { userId } = req.params;
    const { roleId } = req.body;
    const user = req.user;

    if (!user || !user.companyId) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // 1. Verify the target user belongs to the same company
    const targetUser = await prisma.user.findFirst({
      where: {
        id: Number(userId),
        companyId: user.companyId
      }
    });

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found in your organization' });
    }

    // 2. Verify the role belongs to the same company
    if (roleId) {
      const targetRole = await prisma.role.findFirst({
        where: {
          id: Number(roleId),
          companyId: user.companyId
        }
      });

      if (!targetRole) {
        return res.status(400).json({ message: 'Invalid role provided' });
      }
    }

    // 3. Update the user
    const updatedUser = await prisma.user.update({
      where: { id: Number(userId) },
      data: { roleId: roleId ? Number(roleId) : null }
    });

    return res.status(200).json({ success: true, message: 'Role updated successfully', user: updatedUser });
  } catch (error) {
    console.error('Error assigning role:', error);
    return res.status(500).json({ message: 'Internal server error' });
  }
};
