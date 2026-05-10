import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import { generateTempPassword } from '../lib/passwords.js'

/**
 * Org Owner adds a trainer. Same flow as createMember but role = TRAINER.
 */
export async function createTrainer(
  orgId: string,
  input: { email: string; name: string; phone?: string; password?: string }
) {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('Email already registered')

  const password = input.password ?? generateTempPassword()
  const passwordHash = await bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS)

  const trainer = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        name: input.name,
        role: 'TRAINER',
        accountType: 'B2B',
        orgId,
      },
    })
    await tx.userProfile.create({ data: { userId: user.id } })
    return user
  })

  return {
    id: trainer.id,
    email: trainer.email,
    name: trainer.name,
    tempPassword: input.password ? null : password,
  }
}

export async function listTrainers(orgId: string) {
  return prisma.user.findMany({
    where: { orgId, role: 'TRAINER', isActive: true },
    select: {
      id: true,
      email: true,
      name: true,
      phone: true,
      lastLoginAt: true,
      createdAt: true,
      _count: {
        select: {
          trainerAssignments: { where: { isActive: true } },
        },
      },
    },
    orderBy: { createdAt: 'desc' },
  })
}

/**
 * Assign member to trainer. Idempotent: re-assigns if already exists.
 */
export async function assignMemberToTrainer(
  trainerId: string,
  memberId: string,
  orgId: string
) {
  // Verify both are in the same org
  const [trainer, member] = await Promise.all([
    prisma.user.findFirst({ where: { id: trainerId, orgId, role: 'TRAINER' } }),
    prisma.user.findFirst({ where: { id: memberId, orgId, role: 'ORG_MEMBER' } }),
  ])

  if (!trainer || !member) throw new Error('Trainer or member not found in org')

  return prisma.trainerAssignment.upsert({
    where: { trainerId_memberId: { trainerId, memberId } },
    update: { isActive: true },
    create: { trainerId, memberId, orgId, isActive: true },
  })
}

export async function unassignMember(trainerId: string, memberId: string, orgId: string) {
  return prisma.trainerAssignment.updateMany({
    where: { trainerId, memberId, orgId, isActive: true },
    data: { isActive: false },
  })
}

/**
 * Trainer dashboard: list members assigned to current trainer.
 */
export async function getMyAssignedMembers(trainerId: string) {
  return prisma.user.findMany({
    where: {
      role: 'ORG_MEMBER',
      isActive: true,
      assignedToTrainer: {
        some: { trainerId, isActive: true },
      },
    },
    select: {
      id: true,
      name: true,
      email: true,
      phone: true,
      profile: { select: { currentWeightKg: true, fitnessLevel: true } },
      memberSub: {
        select: { status: true, expiresAt: true, plan: { select: { name: true } } },
      },
    },
  })
}
