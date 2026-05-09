/* eslint-disable */
// One-off setup verification: tests DB + AI provider.
// Run: npx tsx scripts/test-setup.ts
import 'dotenv/config'
import { PrismaClient } from '@prisma/client'

const prisma = new PrismaClient()

async function testDB() {
  console.log('━━━ DATABASE ━━━')
  const counts = {
    users: await prisma.user.count(),
    orgs: await prisma.organization.count(),
    foods: await prisma.foodItem.count(),
    indianFoods: await prisma.foodItem.count({ where: { isIndian: true } }),
  }
  console.log('Tables:', JSON.stringify(counts, null, 2))

  const sample = await prisma.foodItem.findMany({
    take: 3,
    select: { name: true, nameLocal: true, caloriesPer100g: true },
    orderBy: { name: 'asc' },
  })
  console.log('Sample foods:', JSON.stringify(sample, null, 2))
}

async function testAI() {
  console.log('\n━━━ AI PROVIDER ━━━')
  const { isAIConfigured, getActiveProvider, getProviderStatus, estimateFood } =
    await import('../src/services/ai/calorieEstimator.js')

  console.log('Configured:', isAIConfigured())
  console.log('Active:', getActiveProvider())
  console.log('Status:', JSON.stringify(getProviderStatus(), null, 2))

  if (!isAIConfigured()) {
    console.log('⚠️  No AI key found — skipping live test')
    return
  }

  console.log('\nTesting AI lookup with "chicken tikka masala"...')
  const start = Date.now()
  const result = await estimateFood('chicken tikka masala')
  const ms = Date.now() - start

  if (!result) {
    console.error('❌ AI returned null')
    return
  }

  console.log(`✓ Got result in ${ms}ms`)
  console.log(JSON.stringify(result, null, 2))
}

async function main() {
  await testDB()
  await testAI()
}

main()
  .catch((e) => {
    console.error('FAIL:', e.message ?? e)
    process.exit(1)
  })
  .finally(() => prisma.$disconnect())
