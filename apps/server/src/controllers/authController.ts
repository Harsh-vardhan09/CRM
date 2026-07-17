// controllers/authController.ts
import type { Response } from "express";
import bcrypt from "bcryptjs";
import crypto from "crypto";
import { prisma } from "@repo/db";
import {
  signAccessToken,
  signRefreshToken,
  verifyRefreshToken,
} from "../utils/jwt.js";
import type { AuthenticatedRequest } from "../middleware/authMiddleware.js";

const cookieOptions = {
  httpOnly: true,
  secure: process.env.NODE_ENV === "production",
  sameSite: "lax" as const,
};

// Helper to hash the refresh token for the @db.Char(64) database column
const hashToken = (token: string): string => {
  return crypto.createHash("sha256").update(token).digest("hex");
};

// ==========================================
// 1. SIGN-UP LOGIC (NEW)
// ==========================================

// FLOW 1: Register a New Company (CEO / Owner)
export const signUpCompany = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { companyName, name, email, password } = req.body;

    if (!companyName || !name || !email || !password) {
      res.status(400).json({
        message: "Please provide companyName, name, email, and password.",
      });
      return;
    }

    // Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res
        .status(400)
        .json({ message: "A user with this email address already exists." });
      return;
    }
    console.log(existingUser);

    // Hash the password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // Use a transaction to ensure all database writes succeed together
    const result = await prisma.$transaction(async (tx: any) => {
      // 1. Create the Company
      const company = await tx.company.create({
        data: {
          name: companyName,
          status: "active",
        },
      });

      // 2. Create the default "Admin" role for this company
      const adminRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: "Admin",
        },
      });

      // 3. Create a default "Sales Rep" role for future employees
      const salesRole = await tx.role.create({
        data: {
          companyId: company.id,
          name: "Sales Rep",
        },
      });

      // 4. Create the User (marked as Owner)
      const user = await tx.user.create({
        data: {
          email,
          passwordHash: hashedPassword,
          name,
          companyId: company.id,
          roleId: adminRole.id,
          isOwner: true,
          isSuperAdmin: false,
          status: "active",
        },
      });

      // 5. Seed Features and Permissions
      const features = await tx.feature.findMany();
      if (features.length > 0) {
        await tx.companyFeature.createMany({
          data: features.map((f: any) => ({ companyId: company.id, featureId: f.id }))
        });

        await tx.rolePermission.createMany({
          data: features.map((f: any) => ({ roleId: adminRole.id, featureId: f.id, accessLevel: "full" }))
        });

        const salesPerms = [
          { code: "leads_management", level: "write" },
          { code: "analytics", level: "read" },
          { code: "automations", level: "read" },
          { code: "settings", level: "read" },
          { code: "feature_support", level: "write" },
          { code: "clients", level: "write" },
        ];

        const salesData = salesPerms.map(sp => {
          const f = features.find((feat: any) => feat.code === sp.code);
          return f ? { roleId: salesRole.id, featureId: f.id, accessLevel: sp.level } : null;
        }).filter(Boolean);

        if (salesData.length > 0) {
          await tx.rolePermission.createMany({ data: salesData });
        }
      }

      return { company, user, adminRole };
    });

    // Auto-login the new Owner
    const accessToken = signAccessToken({
      id: result.user.id,
      role: result.adminRole.name,
    });
    const refreshToken = signRefreshToken({ id: result.user.id });
    const hashedRefresh = hashToken(refreshToken);

    await prisma.user.update({
      where: { id: result.user.id },
      data: {
        refreshTokenHash: hashedRefresh,
        lastLoginAt: new Date(),
      },
    });

    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    res.status(201).json({
      status: "success",
      message: "Company and Owner account registered successfully.",
      data: {
        companyId: result.company.id,
        userId: result.user.id,
      },
    });
  } catch (error) {
    console.error("Company signup error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during company registration." });
  }
};

// FLOW 2: Register an Employee to an Existing Company
export const signUpEmployee = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { name, email, password, companyId } = req.body;

    if (!name || !email || !password || !companyId) {
      res.status(400).json({
        message: "Please provide name, email, password, and companyId.",
      });
      return;
    }

    // 1. Verify the company exists
    const company = await prisma.company.findUnique({
      where: { id: Number(companyId) },
    });
    if (!company) {
      res.status(404).json({ message: "Company not found." });
      return;
    }

    // 2. Check if user already exists
    const existingUser = await prisma.user.findUnique({ where: { email } });
    if (existingUser) {
      res
        .status(400)
        .json({ message: "A user with this email address already exists." });
      return;
    }

    // 3. Hash the password manually
    const salt = await bcrypt.genSalt(10);
    const hashedPassword = await bcrypt.hash(password, salt);

    // 4. Find the pre-seeded "Sales Rep" role for this company
    const salesRepRole = await prisma.role.findFirst({
      where: {
        companyId: Number(companyId),
        name: "Sales Rep",
      },
    });

    // 5. Create the User (roleId is set to the default Sales Rep role, or fallback to null)
    const user = await prisma.user.create({
      data: {
        email,
        passwordHash: hashedPassword,
        name,
        companyId: Number(companyId),
        roleId: salesRepRole ? salesRepRole.id : null,
        isOwner: false,
        isSuperAdmin: false,
        status: "pending",
      },
    });

    res.status(201).json({
      status: "success",
      message: "Your request was submitted and is awaiting approval.",
      data: {
        userId: user.id,
        companyId: user.companyId,
        roleId: user.roleId,
      },
    });
  } catch (error) {
    console.error("Employee signup error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during employee registration." });
  }
};

// ==========================================
// 2. SIGN-IN & SESSION LOGIC (YOUR ORIGINAL LOGIC)
// ==========================================

export const login = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email, password } = req.body;

    if (!email || !password) {
      res.status(400).json({ message: "Please provide email and password." });
      return;
    }

    // Find user by email using Prisma and include their Role relationship
    const user = await prisma.user.findUnique({
      where: { email },
      include: { role: true },
    });

    if (!user || !(await bcrypt.compare(password, user.passwordHash))) {
      res.status(401).json({ message: "Incorrect email or password." });
      return;
    }

    if (user.status === "pending") {
      res
        .status(403)
        .json({ message: "Your account is pending administrator approval." });
      return;
    }

    if (user.status === "rejected") {
      res
        .status(403)
        .json({ message: "Your access request has been rejected." });
      return;
    }

    // Generate tokens
    const accessToken = signAccessToken({
      id: user.id,
      role: user.role?.name || null,
    });
    const refreshToken = signRefreshToken({ id: user.id });

    // Hash refresh token for DB storage security
    const hashedRefresh = hashToken(refreshToken);

    // Update session data in database using Prisma
    await prisma.user.update({
      where: { id: user.id },
      data: {
        refreshTokenHash: hashedRefresh,
        lastLoginAt: new Date(),
      },
    });

    // Set HttpOnly Cookies
    res.cookie("accessToken", accessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.cookie("refreshToken", refreshToken, {
      ...cookieOptions,
      maxAge: 7 * 24 * 60 * 60 * 1000, // 7 days
    });

    // Return user info
    res.status(200).json({
      status: "success",
      user: {
        id: user.id,
        email: user.email,
        name: user.name,
        avatar: user.avatar,
        role: user.role?.name || null,
        isOwner: user.isOwner,
        isSuperAdmin: user.isSuperAdmin,
        companyId: user.companyId,
        lastLoginAt: user.lastLoginAt,
        // Permissions are left empty here; your teammate's resolution logic will populate this later
        permissions: {},
      },
    });
  } catch (error) {
    console.error("Login error:", error);
    res.status(500).json({ message: "Internal server error during login." });
  }
};

export const refresh = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (!refreshToken) {
      res.status(401).json({ message: "Refresh token not found." });
      return;
    }

    // Verify token
    const decoded = verifyRefreshToken(refreshToken);
    if (!decoded || !decoded.id) {
      res.status(401).json({ message: "Invalid or expired refresh token." });
      return;
    }

    // Check if user exists using Prisma
    const user = await prisma.user.findUnique({
      where: { id: decoded.id },
      include: { role: true },
    });

    const incomingHash = hashToken(refreshToken);
    if (!user || user.refreshTokenHash !== incomingHash) {
      res
        .status(401)
        .json({ message: "Token is invalid or has been revoked." });
      return;
    }

    // Sign new access token
    const newAccessToken = signAccessToken({
      id: user.id,
      role: user.role?.name || null,
    });

    // Set cookie
    res.cookie("accessToken", newAccessToken, {
      ...cookieOptions,
      maxAge: 15 * 60 * 1000, // 15 minutes
    });

    res.status(200).json({
      status: "success",
      message: "Access token refreshed successfully.",
    });
  } catch (error) {
    console.error("Refresh token error:", error);
    res
      .status(500)
      .json({ message: "Internal server error during token refresh." });
  }
};

export const logout = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { refreshToken } = req.cookies;

    if (refreshToken) {
      const decoded = verifyRefreshToken(refreshToken);
      if (decoded && decoded.id) {
        // Clear refresh token hash in DB using Prisma
        await prisma.user.update({
          where: { id: decoded.id },
          data: { refreshTokenHash: null },
        });
      }
    }

    // Clear cookies
    res.clearCookie("accessToken", cookieOptions);
    res.clearCookie("refreshToken", cookieOptions);

    res.status(200).json({
      status: "success",
      message: "Logged out successfully.",
    });
  } catch (error) {
    console.error("Logout error:", error);
    res.status(500).json({ message: "Internal server error during logout." });
  }
};

export const getMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    // req.user has been populated by your middleware
    res.status(200).json({
      status: "success",
      user: {
        id: req.user.id,
        email: req.user.email,
        name: req.user.name,
        avatar: req.user.avatar,
        role: req.user.roleName || null,
        isOwner: req.user.isOwner,
        isSuperAdmin: req.user.isSuperAdmin,
        companyId: req.user.companyId,
        permissions: {}, // Left empty; populated later by the permission team
      },
    });
  } catch (error) {
    console.error("Get Me error:", error);
    res
      .status(500)
      .json({ message: "Internal server error fetching profile." });
  }
};

// ==========================================
// 3. ADMIN JOIN-REQUEST ENDPOINTS (NEW)
// ==========================================

export const getJoinRequests = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || !req.user.companyId) {
      res.status(400).json({ message: "Company context missing." });
      return;
    }

    const pendingUsers = await prisma.user.findMany({
      where: {
        companyId: req.user.companyId,
        status: "pending",
        deletedAt: null,
      },
      select: {
        id: true,
        name: true,
        email: true,
        createdAt: true,
      },
    });

    res.status(200).json({ status: "success", data: pendingUsers });
  } catch (error) {
    console.error("getJoinRequests error:", error);
    res.status(500).json({ message: "Error fetching join requests." });
  }
};

export const approveJoinRequest = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || !req.user.companyId) {
      res.status(400).json({ message: "Company context missing." });
      return;
    }

    const { userId, roleId } = req.body;
    if (!userId || !roleId) {
      res.status(400).json({ message: "userId and roleId are required." });
      return;
    }

    await prisma.user.update({
      where: {
        id: Number(userId),
        companyId: req.user.companyId,
      },
      data: {
        status: "active",
        roleId: Number(roleId),
      },
    });

    res
      .status(200)
      .json({ status: "success", message: "User approved successfully." });
  } catch (error) {
    console.error("approveJoinRequest error:", error);
    res.status(500).json({ message: "Error approving join request." });
  }
};

export const rejectJoinRequest = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || !req.user.companyId) {
      res.status(400).json({ message: "Company context missing." });
      return;
    }

    const { userId } = req.body;
    if (!userId) {
      res.status(400).json({ message: "userId is required." });
      return;
    }

    await prisma.user.update({
      where: {
        id: Number(userId),
        companyId: req.user.companyId,
      },
      data: {
        status: "rejected",
      },
    });

    res
      .status(200)
      .json({ status: "success", message: "User rejected successfully." });
  } catch (error) {
    console.error("rejectJoinRequest error:", error);
    res.status(500).json({ message: "Error rejecting join request." });
  }
};

export const getCompanyRoles = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user || !req.user.companyId) {
      res.status(400).json({ message: "Company context missing." });
      return;
    }

    const roles = await prisma.role.findMany({
      where: { companyId: req.user.companyId },
      select: { id: true, name: true },
    });

    res.status(200).json({ status: "success", data: roles });
  } catch (error) {
    console.error("getCompanyRoles error:", error);
    res.status(500).json({ message: "Error fetching roles." });
  }
};

// ==========================================
// 4. PROFILE / ACCOUNT SETTINGS ENDPOINTS
// ==========================================

export const updateMe = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    const { name, avatar } = req.body;
    const updateData: Record<string, any> = {};
    if (name !== undefined) updateData.name = name;
    if (avatar !== undefined) updateData.avatar = avatar;

    if (Object.keys(updateData).length === 0) {
      res.status(400).json({ message: "No updatable fields provided." });
      return;
    }

    const updated = await prisma.user.update({
      where: { id: req.user.id },
      data: updateData,
      select: { id: true, email: true, name: true, avatar: true },
    });

    res.status(200).json({ status: "success", user: updated });
  } catch (error) {
    console.error("updateMe error:", error);
    res.status(500).json({ message: "Internal server error updating profile." });
  }
};

export const updatePassword = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    if (!req.user) {
      res.status(401).json({ message: "Not authenticated." });
      return;
    }

    const { currentPassword, newPassword } = req.body;
    if (!currentPassword || !newPassword) {
      res.status(400).json({ message: "currentPassword and newPassword are required." });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ message: "New password must be at least 8 characters." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { id: req.user.id } });
    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const valid = await bcrypt.compare(currentPassword, user.passwordHash);
    if (!valid) {
      res.status(401).json({ message: "Current password is incorrect." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({ where: { id: user.id }, data: { passwordHash } });

    res.status(200).json({ status: "success", message: "Password updated successfully." });
  } catch (error) {
    console.error("updatePassword error:", error);
    res.status(500).json({ message: "Internal server error updating password." });
  }
};

// ==========================================
// 5. FORGOT / RESET PASSWORD FLOW
// ==========================================

export const forgotPassword = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { email } = req.body;
    if (!email) {
      res.status(400).json({ message: "Email is required." });
      return;
    }

    const user = await prisma.user.findUnique({ where: { email } });

    // Always respond 200 to prevent email enumeration
    if (!user) {
      res.status(200).json({ status: "success", message: "If that email exists, a reset link has been sent." });
      return;
    }

    const rawToken = crypto.randomBytes(32).toString("hex");
    const tokenHash = hashToken(rawToken);
    const expiresAt = new Date(Date.now() + 60 * 60 * 1000); // 1 hour

    await prisma.user.update({
      where: { id: user.id },
      data: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: expiresAt,
      },
    });

    // TODO: send via Resend once transactional email templates exist
    console.log(`[FORGOT PASSWORD] Reset token for ${email}: ${rawToken}`);

    res.status(200).json({ status: "success", message: "If that email exists, a reset link has been sent." });
  } catch (error) {
    console.error("forgotPassword error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};

export const resetPassword = async (
  req: AuthenticatedRequest,
  res: Response,
): Promise<void> => {
  try {
    const { token, newPassword } = req.body;
    if (!token || !newPassword) {
      res.status(400).json({ message: "token and newPassword are required." });
      return;
    }
    if (newPassword.length < 8) {
      res.status(400).json({ message: "New password must be at least 8 characters." });
      return;
    }

    const tokenHash = hashToken(token);

    const user = await prisma.user.findFirst({
      where: {
        resetTokenHash: tokenHash,
        resetTokenExpiresAt: { gt: new Date() },
        deletedAt: null,
      },
    });

    if (!user) {
      res.status(400).json({ message: "Reset token is invalid or has expired." });
      return;
    }

    const salt = await bcrypt.genSalt(10);
    const passwordHash = await bcrypt.hash(newPassword, salt);

    await prisma.user.update({
      where: { id: user.id },
      data: {
        passwordHash,
        resetTokenHash: null,
        resetTokenExpiresAt: null,
        refreshTokenHash: null, // invalidate all sessions
      },
    });

    res.status(200).json({ status: "success", message: "Password has been reset successfully." });
  } catch (error) {
    console.error("resetPassword error:", error);
    res.status(500).json({ message: "Internal server error." });
  }
};
