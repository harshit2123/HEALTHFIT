import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import { generateTempPassword } from '../lib/passwords.js'

export interface CreateMemberInput {
  email: string
  name: string
  phone?: string
  password?: string // optional — if not provided, generate temp + send via email
  age?: number
  gender?: string
  heightCm?: number
  currentWeightKg?: number
  fitnessLevel?: string
}

export interface ListMembersOptions {
  page?: number
  limit?: number
  search?: string // by name or email
  trainerId?: string // filter by assigned trainer
  status?: 'ACTIVE' | 'INACTIVE'
}

/**
 * Create a member in an org.
 * - ORG_OWNER: just creates the member.
 * - TRAINER: creates the member AND auto-assigns to themselves.
 *
 * Tracks createdById so the owner can see a conversion leaderboard.
 */
export async function createMember(
  orgId: string,
  creatorId: string,
  creatorRole: 'ORG_OWNER' | 'TRAINER',
  input: CreateMemberInput
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('Email already registered')

  const password = input.password ?? generateTempPassword()
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        name: input.name,
        role: 'ORG_MEMBER',
        accountType: 'B2B',
        orgId,
        createdById: creatorId,
      },
    })

    await tx.userProfile.create({
      data: {
        userId: user.id,
        age: input.age,
        gender: input.gender,
        heightCm: input.heightCm,
        currentWeightKg: input.currentWeightKg,
        fitnessLevel: input.fitnessLevel,
      },
    })

    if (creatorRole === 'TRAINER') {
      await tx.trainerAssignment.create({
        data: { trainerId: creatorId, memberId: user.id, orgId, isActive: true },
      })
    }

    return user
  })

  return {
    id: result.id,
    email: result.email,
    name: result.name,
    tempPassword: input.password ? null : password, // return only if generated
    autoAssignedToTrainer: creatorRole === 'TRAINER',
  }
}

interface ConversionLeaderboardEntry {
  creatorId: string
  creatorName: string
  creatorRole: 'ORG_OWNER' | 'TRAINER'
  membersAdded: number
}

/**
 * Conversion leaderboard for owner dashboard.
 * Shows: who created which members, with optional date range.
 */
export async function getConversionLeaderboard(
  orgId: string,
  options: { since?: Date } = {}
): Promise<ConversionLeaderboardEntry[]> {
  const grouped = await prisma.user.groupBy({
    by: ['createdById'],
    where: {
      orgId,
      role: 'ORG_MEMBER',
      createdById: { not: null },
      ...(options.since ? { createdAt: { gte: options.since } } : {}),
    },
    _count: true,
  })

  if (grouped.length === 0) return []

  const creatorIds = grouped
    .map((g) => g.createdById)
    .filter((id): id is string => !!id)

  const creators = await prisma.user.findMany({
    where: { id: { in: creatorIds } },
    select: { id: true, name: true, email: true, role: true },
  })

  const byId = new Map(creators.map((c) => [c.id, c]))

  return grouped
    .map((g) => {
      const creator = g.createdById ? byId.get(g.createdById) : null
      if (!creator) return null
      return {
        creatorId: creator.id,
        creatorName: creator.name,
        creatorRole: creator.role as 'ORG_OWNER' | 'TRAINER',
        membersAdded: g._count,
      }
    })
    .filter((x): x is ConversionLeaderboardEntry => x !== null)
    .sort((a, b) => b.membersAdded - a.membersAdded)
}

/**
 * List members in an org. Trainers see only their assigned members.
 */
export async function listMembers(
  orgId: string,
  viewerRole: 'ORG_OWNER' | 'TRAINER',
  viewerId: string,
  options: ListMembersOptions = {}
) {
  const page = options.page ?? 1
  const limit = Math.min(options.limit ?? 20, 100)
  const skip = (page - 1) * limit

  const baseWhere = {
    orgId,
    role: 'ORG_MEMBER' as const,
    ...(options.status === 'ACTIVE' ? { isActive: true } : {}),
    ...(options.status === 'INACTIVE' ? { isActive: false } : {}),
    ...(options.search
      ? {
          OR: [
            { name: { contains: options.search, mode: 'insensitive' as const } },
            { email: { contains: options.search, mode: 'insensitive' as const } },
          ],
        }
      : {}),
  }

  // Trainer: filter to only members assigned to them
  const where =
    viewerRole === 'TRAINER'
      ? {
          ...baseWhere,
          assignedToTrainer: {
            some: { trainerId: viewerId, isActive: true },
          },
        }
      : options.trainerId
        ? {
            ...baseWhere,
            assignedToTrainer: {
              some: { trainerId: options.trainerId, isActive: true },
            },
          }
        : baseWhere

  const [members, total] = await Promise.all([
    prisma.user.findMany({
      where,
      skip,
      take: limit,
      select: {
        id: true,
        email: true,
        name: true,
        phone: true,
        isActive: true,
        lastLoginAt: true,
        createdAt: true,
        memberSub: {
          select: {
            status: true,
            expiresAt: true,
            plan: { select: { name: true } },
          },
        },
        assignedToTrainer: {
          where: { isActive: true },
          select: {
            trainer: { select: { id: true, name: true } },
          },
        },
      },
      orderBy: { createdAt: 'desc' },
    }),
    prisma.user.count({ where }),
  ])

  return { members, total, page, limit }
}

/**
 * Get single member detail. Trainer: only assigned. Owner: any in org.
 */
export async function getMemberById(
  memberId: string,
  orgId: string,
  viewerRole: 'ORG_OWNER' | 'TRAINER',
  viewerId: string
) {
  const member = await prisma.user.findFirst({
    where: {
      id: memberId,
      orgId,
      role: 'ORG_MEMBER',
      ...(viewerRole === 'TRAINER'
        ? {
            assignedToTrainer: {
              some: { trainerId: viewerId, isActive: true },
            },
          }
        : {}),
    },
    include: {
      profile: true,
      memberSub: {
        include: { plan: true },
      },
      assignedToTrainer: {
        where: { isActive: true },
        include: {
          trainer: { select: { id: true, name: true, email: true } },
        },
      },
    },
  })

  if (!member) throw new Error('Member not found or access denied')
  return member
}

/**
 * Update member. Owner can edit anything. Trainer only their assigned members
 * and only specific fields (notes, etc — no role changes).
 */
export async function updateMember(
  memberId: string,
  orgId: string,
  viewerRole: 'ORG_OWNER' | 'TRAINER',
  viewerId: string,
  updates: { name?: string; phone?: string; isActive?: boolean }
) {
  // Verify access first
  await getMemberById(memberId, orgId, viewerRole, viewerId)

  // Trainers cannot deactivate
  if (viewerRole === 'TRAINER' && updates.isActive !== undefined) {
    throw new Error('Trainers cannot deactivate members')
  }

  return prisma.user.update({
    where: { id: memberId },
    data: updates,
  })
}

/**
 * Soft delete (deactivate) member. Owner only.
 */
export async function deactivateMember(memberId: string, orgId: string) {
  const member = await prisma.user.findFirst({
    where: { id: memberId, orgId, role: 'ORG_MEMBER' },
  })
  if (!member) throw new Error('Member not found')

  return prisma.user.update({
    where: { id: memberId },
    data: { isActive: false },
  })
}
