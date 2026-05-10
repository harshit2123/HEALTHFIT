import bcrypt from 'bcryptjs'
import { prisma } from '../lib/prisma.js'
import { env } from '../lib/env.js'
import { signAccessToken, issueRefreshToken } from './tokenService.js'
import type { User, UserRole, AccountType } from '@spacefit/shared'

export interface RegisterB2BInput {
  email: string
  password: string
  name: string
  phone?: string
  // Org details (creates new gym)
  orgName: string
  orgDescription?: string
  orgPhone?: string
  orgAddress?: string
}

export interface RegisterB2CInput {
  email: string
  password: string
  name: string
  phone?: string
  age?: number
  heightCm?: number
  currentWeightKg?: number
  primaryGoal?: 'LOSE_WEIGHT' | 'GAIN_MUSCLE' | 'BUILD_ENDURANCE' | 'JUST_TRACK'
}

export interface AuthResponse {
  user: User
  accessToken: string
  refreshToken: string
}

async function hashPassword(password: string): Promise<string> {
  return bcrypt.hash(password, env.BCRYPT_SALT_ROUNDS)
}

async function verifyPassword(password: string, hash: string): Promise<boolean> {
  return bcrypt.compare(password, hash)
}

function toUserDTO(user: {
  id: string
  email: string
  name: string
  role: UserRole
  accountType: AccountType
  orgId: string | null
}): User {
  return {
    id: user.id,
    email: user.email,
    name: user.name,
    role: user.role,
    accountType: user.accountType,
    orgId: user.orgId,
  }
}

async function buildAuthResponse(userId: string): Promise<AuthResponse> {
  const user = await prisma.user.findUniqueOrThrow({
    where: { id: userId },
    select: { id: true, email: true, name: true, role: true, accountType: true, orgId: true },
  })

  const dto = toUserDTO(user)
  const accessToken = signAccessToken({
    userId: dto.id,
    role: dto.role,
    accountType: dto.accountType,
    orgId: dto.orgId,
  })
  const refreshToken = await issueRefreshToken(dto.id)

  return { user: dto, accessToken, refreshToken }
}

// =====================================================
// B2B: Gym owner registers + creates their org in one transaction
// =====================================================

export async function registerB2BOwner(input: RegisterB2BInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('Email already registered')

  const passwordHash = await hashPassword(input.password)

  // Transaction: create user → create org → link owner → create profile
  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        name: input.name,
        role: 'ORG_OWNER',
        accountType: 'B2B',
        // orgId set after org is created
      },
    })

    const org = await tx.organization.create({
      data: {
        name: input.orgName,
        ownerId: user.id,
        description: input.orgDescription,
        phone: input.orgPhone,
        address: input.orgAddress,
      },
    })

    // Link user back to org
    await tx.user.update({
      where: { id: user.id },
      data: { orgId: org.id },
    })

    await tx.userProfile.create({
      data: { userId: user.id },
    })

    return user.id
  })

  return buildAuthResponse(result)
}

// =====================================================
// B2C: Individual user registers + auto-starts 30-day trial
// =====================================================

export async function registerB2CIndividual(input: RegisterB2CInput): Promise<AuthResponse> {
  const existing = await prisma.user.findUnique({ where: { email: input.email } })
  if (existing) throw new Error('Email already registered')

  const passwordHash = await hashPassword(input.password)

  const trialStartedAt = new Date()
  const trialEndsAt = new Date()
  trialEndsAt.setDate(trialEndsAt.getDate() + env.B2C_TRIAL_DAYS)

  const result = await prisma.$transaction(async (tx) => {
    const user = await tx.user.create({
      data: {
        email: input.email,
        phone: input.phone,
        passwordHash,
        name: input.name,
        role: 'INDIVIDUAL_USER',
        accountType: 'B2C',
        orgId: null, // B2C has no org
      },
    })

    await tx.userProfile.create({
      data: {
        userId: user.id,
        age: input.age,
        heightCm: input.heightCm,
        currentWeightKg: input.currentWeightKg,
        primaryGoal: input.primaryGoal,
      },
    })

    // Auto-start 30-day trial
    await tx.personalSubscription.create({
      data: {
        userId: user.id,
        tier: 'TRIAL',
        trialStartedAt,
        trialEndsAt,
        status: 'TRIAL',
      },
    })

    return user.id
  })

  return buildAuthResponse(result)
}

// =====================================================
// Login (works for all roles)
// =====================================================

export async function login(email: string, password: string): Promise<AuthResponse> {
  const user = await prisma.user.findUnique({ where: { email } })
  if (!user || !user.isActive) throw new Error('Invalid credentials')

  const valid = await verifyPassword(password, user.passwordHash)
  if (!valid) throw new Error('Invalid credentials')

  await prisma.user.update({
    where: { id: user.id },
    data: { lastLoginAt: new Date() },
  })

  return buildAuthResponse(user.id)
}
