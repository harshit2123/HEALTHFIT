/**
 * Indian foods seed — common items with macros per 100g.
 * Source: ICMR-NIN food composition tables, IFCT 2017.
 * Run: npx tsx prisma/seed-foods.ts
 */
import { PrismaClient } from '@prisma/client'

// Seed runs once → use direct connection (port 5432) to avoid pooler tenant issues
const prisma = new PrismaClient({
  datasources: {
    db: { url: process.env.DIRECT_URL ?? process.env.DATABASE_URL },
  },
})

interface FoodSeed {
  name: string
  nameLocal?: string
  category: string
  servingSize: string
  caloriesPer100g: number
  proteinG: number
  carbsG: number
  fatG: number
  fiberG?: number
}

const FOODS: FoodSeed[] = [
  // Grains & breads
  { name: 'Roti (whole wheat)', nameLocal: 'रोटी', category: 'grain', servingSize: '1 medium (40g)', caloriesPer100g: 297, proteinG: 11, carbsG: 56, fatG: 4, fiberG: 11 },
  { name: 'Chapati', nameLocal: 'चपाती', category: 'grain', servingSize: '1 medium (40g)', caloriesPer100g: 297, proteinG: 11, carbsG: 56, fatG: 4, fiberG: 11 },
  { name: 'Paratha (plain)', category: 'grain', servingSize: '1 medium (60g)', caloriesPer100g: 320, proteinG: 9, carbsG: 50, fatG: 11, fiberG: 7 },
  { name: 'Aloo paratha', category: 'grain', servingSize: '1 medium (100g)', caloriesPer100g: 250, proteinG: 7, carbsG: 38, fatG: 8, fiberG: 5 },
  { name: 'Naan', category: 'grain', servingSize: '1 medium (90g)', caloriesPer100g: 310, proteinG: 9, carbsG: 56, fatG: 6, fiberG: 3 },
  { name: 'Rice (white, cooked)', nameLocal: 'चावल', category: 'grain', servingSize: '1 cup (158g)', caloriesPer100g: 130, proteinG: 2.7, carbsG: 28, fatG: 0.3, fiberG: 0.4 },
  { name: 'Rice (basmati, cooked)', category: 'grain', servingSize: '1 cup (158g)', caloriesPer100g: 121, proteinG: 3, carbsG: 26, fatG: 0.4, fiberG: 0.4 },
  { name: 'Brown rice (cooked)', category: 'grain', servingSize: '1 cup (195g)', caloriesPer100g: 112, proteinG: 2.6, carbsG: 24, fatG: 0.9, fiberG: 1.8 },
  { name: 'Poha', nameLocal: 'पोहा', category: 'grain', servingSize: '1 bowl (150g)', caloriesPer100g: 130, proteinG: 2.6, carbsG: 27, fatG: 1.5, fiberG: 1 },
  { name: 'Upma', category: 'grain', servingSize: '1 bowl (150g)', caloriesPer100g: 132, proteinG: 3, carbsG: 22, fatG: 4, fiberG: 1.5 },
  { name: 'Idli', nameLocal: 'इडली', category: 'grain', servingSize: '1 piece (40g)', caloriesPer100g: 156, proteinG: 5, carbsG: 33, fatG: 0.5, fiberG: 1.5 },
  { name: 'Dosa (plain)', nameLocal: 'दोसा', category: 'grain', servingSize: '1 medium (80g)', caloriesPer100g: 168, proteinG: 4, carbsG: 29, fatG: 4, fiberG: 1 },
  { name: 'Masala dosa', category: 'grain', servingSize: '1 medium (150g)', caloriesPer100g: 168, proteinG: 4, carbsG: 25, fatG: 6, fiberG: 2 },
  { name: 'Uttapam', category: 'grain', servingSize: '1 piece (130g)', caloriesPer100g: 142, proteinG: 4, carbsG: 24, fatG: 3, fiberG: 1.5 },

  // Dals & legumes
  { name: 'Dal (toor/arhar, cooked)', nameLocal: 'अरहर दाल', category: 'dal', servingSize: '1 bowl (150g)', caloriesPer100g: 116, proteinG: 7, carbsG: 20, fatG: 0.4, fiberG: 4 },
  { name: 'Dal (moong, cooked)', nameLocal: 'मूंग दाल', category: 'dal', servingSize: '1 bowl (150g)', caloriesPer100g: 105, proteinG: 7, carbsG: 19, fatG: 0.4, fiberG: 7 },
  { name: 'Dal (chana, cooked)', category: 'dal', servingSize: '1 bowl (150g)', caloriesPer100g: 130, proteinG: 7, carbsG: 22, fatG: 2, fiberG: 5 },
  { name: 'Dal (masoor, cooked)', category: 'dal', servingSize: '1 bowl (150g)', caloriesPer100g: 116, proteinG: 9, carbsG: 20, fatG: 0.4, fiberG: 8 },
  { name: 'Rajma (cooked)', nameLocal: 'राजमा', category: 'dal', servingSize: '1 bowl (150g)', caloriesPer100g: 127, proteinG: 9, carbsG: 22, fatG: 0.5, fiberG: 6 },
  { name: 'Chole (chickpeas, cooked)', nameLocal: 'चना', category: 'dal', servingSize: '1 bowl (150g)', caloriesPer100g: 164, proteinG: 9, carbsG: 27, fatG: 3, fiberG: 8 },
  { name: 'Black-eyed beans (cooked)', category: 'dal', servingSize: '1 bowl (150g)', caloriesPer100g: 116, proteinG: 8, carbsG: 21, fatG: 0.5, fiberG: 7 },

  // Vegetables (curries)
  { name: 'Aloo gobi', category: 'vegetable', servingSize: '1 bowl (150g)', caloriesPer100g: 100, proteinG: 3, carbsG: 12, fatG: 5, fiberG: 3 },
  { name: 'Bhindi (okra fry)', category: 'vegetable', servingSize: '1 bowl (150g)', caloriesPer100g: 88, proteinG: 2, carbsG: 8, fatG: 5, fiberG: 3 },
  { name: 'Baingan bharta', category: 'vegetable', servingSize: '1 bowl (150g)', caloriesPer100g: 87, proteinG: 1.5, carbsG: 7, fatG: 5, fiberG: 3 },
  { name: 'Palak paneer', category: 'vegetable', servingSize: '1 bowl (150g)', caloriesPer100g: 180, proteinG: 11, carbsG: 8, fatG: 12, fiberG: 3 },
  { name: 'Saag (mixed greens)', category: 'vegetable', servingSize: '1 bowl (150g)', caloriesPer100g: 80, proteinG: 4, carbsG: 6, fatG: 5, fiberG: 4 },
  { name: 'Mixed vegetable curry', category: 'vegetable', servingSize: '1 bowl (150g)', caloriesPer100g: 95, proteinG: 3, carbsG: 11, fatG: 4, fiberG: 4 },
  { name: 'Tomato (raw)', category: 'vegetable', servingSize: '1 medium (123g)', caloriesPer100g: 18, proteinG: 0.9, carbsG: 3.9, fatG: 0.2, fiberG: 1.2 },
  { name: 'Onion (raw)', category: 'vegetable', servingSize: '1 medium (110g)', caloriesPer100g: 40, proteinG: 1.1, carbsG: 9.3, fatG: 0.1, fiberG: 1.7 },
  { name: 'Cucumber', category: 'vegetable', servingSize: '1 cup (100g)', caloriesPer100g: 15, proteinG: 0.7, carbsG: 3.6, fatG: 0.1, fiberG: 0.5 },
  { name: 'Carrot (raw)', category: 'vegetable', servingSize: '1 medium (60g)', caloriesPer100g: 41, proteinG: 0.9, carbsG: 9.6, fatG: 0.2, fiberG: 2.8 },

  // Dairy & paneer
  { name: 'Paneer', nameLocal: 'पनीर', category: 'dairy', servingSize: '50g cube', caloriesPer100g: 265, proteinG: 18, carbsG: 1.2, fatG: 21, fiberG: 0 },
  { name: 'Curd / Dahi (whole)', nameLocal: 'दही', category: 'dairy', servingSize: '1 bowl (200g)', caloriesPer100g: 60, proteinG: 3.5, carbsG: 4.7, fatG: 3.3, fiberG: 0 },
  { name: 'Curd / Dahi (low-fat)', category: 'dairy', servingSize: '1 bowl (200g)', caloriesPer100g: 56, proteinG: 4, carbsG: 6, fatG: 1.7, fiberG: 0 },
  { name: 'Milk (whole)', nameLocal: 'दूध', category: 'dairy', servingSize: '1 cup (240ml)', caloriesPer100g: 61, proteinG: 3.2, carbsG: 4.8, fatG: 3.3, fiberG: 0 },
  { name: 'Milk (toned)', category: 'dairy', servingSize: '1 cup (240ml)', caloriesPer100g: 58, proteinG: 3.1, carbsG: 4.6, fatG: 3, fiberG: 0 },
  { name: 'Milk (skimmed)', category: 'dairy', servingSize: '1 cup (240ml)', caloriesPer100g: 35, proteinG: 3.4, carbsG: 5, fatG: 0.1, fiberG: 0 },
  { name: 'Buttermilk / Chaas', nameLocal: 'छाछ', category: 'dairy', servingSize: '1 glass (250ml)', caloriesPer100g: 40, proteinG: 3.3, carbsG: 4.8, fatG: 0.9, fiberG: 0 },
  { name: 'Lassi (sweet)', category: 'dairy', servingSize: '1 glass (250ml)', caloriesPer100g: 90, proteinG: 3, carbsG: 14, fatG: 2.5, fiberG: 0 },
  { name: 'Ghee', nameLocal: 'घी', category: 'fat', servingSize: '1 tsp (5g)', caloriesPer100g: 900, proteinG: 0, carbsG: 0, fatG: 100, fiberG: 0 },
  { name: 'Butter', category: 'fat', servingSize: '1 tbsp (14g)', caloriesPer100g: 717, proteinG: 0.9, carbsG: 0.1, fatG: 81, fiberG: 0 },

  // Meat / chicken / fish / eggs
  { name: 'Chicken (curry)', category: 'protein', servingSize: '1 bowl (150g)', caloriesPer100g: 180, proteinG: 18, carbsG: 4, fatG: 10, fiberG: 1 },
  { name: 'Chicken (tandoori)', category: 'protein', servingSize: '1 piece (100g)', caloriesPer100g: 195, proteinG: 26, carbsG: 2, fatG: 9, fiberG: 0 },
  { name: 'Chicken (grilled, skinless)', category: 'protein', servingSize: '100g', caloriesPer100g: 165, proteinG: 31, carbsG: 0, fatG: 3.6, fiberG: 0 },
  { name: 'Chicken biryani', category: 'protein', servingSize: '1 plate (250g)', caloriesPer100g: 200, proteinG: 9, carbsG: 25, fatG: 7, fiberG: 1.5 },
  { name: 'Mutton curry', category: 'protein', servingSize: '1 bowl (150g)', caloriesPer100g: 240, proteinG: 18, carbsG: 4, fatG: 17, fiberG: 0.5 },
  { name: 'Fish curry', category: 'protein', servingSize: '1 bowl (150g)', caloriesPer100g: 145, proteinG: 16, carbsG: 4, fatG: 7, fiberG: 0.5 },
  { name: 'Egg (whole, boiled)', nameLocal: 'अंडा', category: 'protein', servingSize: '1 large (50g)', caloriesPer100g: 155, proteinG: 13, carbsG: 1.1, fatG: 11, fiberG: 0 },
  { name: 'Egg white (boiled)', category: 'protein', servingSize: '1 large (33g)', caloriesPer100g: 52, proteinG: 11, carbsG: 0.7, fatG: 0.2, fiberG: 0 },
  { name: 'Egg curry', category: 'protein', servingSize: '1 bowl with 2 eggs', caloriesPer100g: 170, proteinG: 10, carbsG: 6, fatG: 12, fiberG: 1 },
  { name: 'Omelette (2 eggs)', category: 'protein', servingSize: '1 serving (100g)', caloriesPer100g: 154, proteinG: 11, carbsG: 1, fatG: 12, fiberG: 0 },

  // Snacks
  { name: 'Samosa', nameLocal: 'समोसा', category: 'snack', servingSize: '1 piece (50g)', caloriesPer100g: 308, proteinG: 5, carbsG: 32, fatG: 18, fiberG: 3 },
  { name: 'Pakora (mixed)', category: 'snack', servingSize: '4 pieces (60g)', caloriesPer100g: 315, proteinG: 7, carbsG: 28, fatG: 19, fiberG: 4 },
  { name: 'Vada pav', category: 'snack', servingSize: '1 piece (130g)', caloriesPer100g: 290, proteinG: 8, carbsG: 38, fatG: 12, fiberG: 4 },
  { name: 'Pav bhaji', category: 'snack', servingSize: '1 plate (300g)', caloriesPer100g: 145, proteinG: 4, carbsG: 18, fatG: 6, fiberG: 4 },
  { name: 'Pani puri (5 pieces)', category: 'snack', servingSize: '5 pieces (75g)', caloriesPer100g: 130, proteinG: 3, carbsG: 25, fatG: 2, fiberG: 1 },
  { name: 'Bhel puri', category: 'snack', servingSize: '1 plate (100g)', caloriesPer100g: 230, proteinG: 6, carbsG: 38, fatG: 6, fiberG: 4 },
  { name: 'Dhokla', category: 'snack', servingSize: '2 pieces (100g)', caloriesPer100g: 160, proteinG: 6, carbsG: 26, fatG: 4, fiberG: 2 },
  { name: 'Khakhra', category: 'snack', servingSize: '2 pieces (30g)', caloriesPer100g: 380, proteinG: 11, carbsG: 65, fatG: 8, fiberG: 8 },
  { name: 'Murmura / Puffed rice', category: 'snack', servingSize: '1 cup (15g)', caloriesPer100g: 402, proteinG: 6.6, carbsG: 90, fatG: 0.6, fiberG: 0.7 },

  // Sweets
  { name: 'Gulab jamun', nameLocal: 'गुलाब जामुन', category: 'sweet', servingSize: '1 piece (40g)', caloriesPer100g: 290, proteinG: 4, carbsG: 50, fatG: 9, fiberG: 0.5 },
  { name: 'Jalebi', category: 'sweet', servingSize: '2 pieces (60g)', caloriesPer100g: 320, proteinG: 3, carbsG: 67, fatG: 6, fiberG: 0.5 },
  { name: 'Rasgulla', category: 'sweet', servingSize: '1 piece (40g)', caloriesPer100g: 186, proteinG: 4, carbsG: 36, fatG: 2.5, fiberG: 0 },
  { name: 'Kheer', category: 'sweet', servingSize: '1 bowl (150g)', caloriesPer100g: 180, proteinG: 5, carbsG: 26, fatG: 6, fiberG: 0.5 },
  { name: 'Halwa (suji)', category: 'sweet', servingSize: '1 bowl (100g)', caloriesPer100g: 350, proteinG: 5, carbsG: 50, fatG: 14, fiberG: 1 },
  { name: 'Laddu (besan)', category: 'sweet', servingSize: '1 piece (40g)', caloriesPer100g: 460, proteinG: 9, carbsG: 56, fatG: 22, fiberG: 3 },

  // Fruits
  { name: 'Banana', nameLocal: 'केला', category: 'fruit', servingSize: '1 medium (118g)', caloriesPer100g: 89, proteinG: 1.1, carbsG: 23, fatG: 0.3, fiberG: 2.6 },
  { name: 'Apple', nameLocal: 'सेब', category: 'fruit', servingSize: '1 medium (180g)', caloriesPer100g: 52, proteinG: 0.3, carbsG: 14, fatG: 0.2, fiberG: 2.4 },
  { name: 'Orange', category: 'fruit', servingSize: '1 medium (130g)', caloriesPer100g: 47, proteinG: 0.9, carbsG: 12, fatG: 0.1, fiberG: 2.4 },
  { name: 'Mango', nameLocal: 'आम', category: 'fruit', servingSize: '1 cup (165g)', caloriesPer100g: 60, proteinG: 0.8, carbsG: 15, fatG: 0.4, fiberG: 1.6 },
  { name: 'Papaya', category: 'fruit', servingSize: '1 cup (140g)', caloriesPer100g: 43, proteinG: 0.5, carbsG: 11, fatG: 0.3, fiberG: 1.7 },
  { name: 'Watermelon', category: 'fruit', servingSize: '1 cup (152g)', caloriesPer100g: 30, proteinG: 0.6, carbsG: 8, fatG: 0.2, fiberG: 0.4 },
  { name: 'Pomegranate', category: 'fruit', servingSize: '1 cup (174g)', caloriesPer100g: 83, proteinG: 1.7, carbsG: 19, fatG: 1.2, fiberG: 4 },
  { name: 'Guava', nameLocal: 'अमरूद', category: 'fruit', servingSize: '1 medium (165g)', caloriesPer100g: 68, proteinG: 2.6, carbsG: 14, fatG: 0.9, fiberG: 5.4 },

  // Nuts & seeds
  { name: 'Almonds', nameLocal: 'बादाम', category: 'nut', servingSize: '10 pieces (15g)', caloriesPer100g: 579, proteinG: 21, carbsG: 22, fatG: 50, fiberG: 12 },
  { name: 'Cashew nuts', category: 'nut', servingSize: '10 pieces (15g)', caloriesPer100g: 553, proteinG: 18, carbsG: 30, fatG: 44, fiberG: 3.3 },
  { name: 'Walnuts', category: 'nut', servingSize: '5 halves (15g)', caloriesPer100g: 654, proteinG: 15, carbsG: 14, fatG: 65, fiberG: 6.7 },
  { name: 'Peanuts (roasted)', nameLocal: 'मूंगफली', category: 'nut', servingSize: '1 small handful (30g)', caloriesPer100g: 567, proteinG: 26, carbsG: 16, fatG: 49, fiberG: 8.5 },

  // Beverages
  { name: 'Chai (with sugar)', nameLocal: 'चाय', category: 'beverage', servingSize: '1 cup (200ml)', caloriesPer100g: 50, proteinG: 1.5, carbsG: 8, fatG: 1.5, fiberG: 0 },
  { name: 'Coffee (with sugar)', category: 'beverage', servingSize: '1 cup (200ml)', caloriesPer100g: 35, proteinG: 1, carbsG: 6, fatG: 1, fiberG: 0 },
  { name: 'Black tea (no sugar)', category: 'beverage', servingSize: '1 cup (200ml)', caloriesPer100g: 1, proteinG: 0, carbsG: 0.3, fatG: 0, fiberG: 0 },
  { name: 'Coconut water', category: 'beverage', servingSize: '1 glass (240ml)', caloriesPer100g: 19, proteinG: 0.7, carbsG: 3.7, fatG: 0.2, fiberG: 1.1 },
]

async function main() {
  console.log(`Seeding ${FOODS.length} Indian foods…`)

  // Idempotent: only insert if not present
  let inserted = 0
  let skipped = 0

  for (const food of FOODS) {
    const existing = await prisma.foodItem.findFirst({
      where: { name: food.name, isCustom: false },
    })

    if (existing) {
      skipped++
      continue
    }

    await prisma.foodItem.create({
      data: {
        name: food.name,
        nameLocal: food.nameLocal,
        category: food.category,
        servingSize: food.servingSize,
        caloriesPer100g: food.caloriesPer100g,
        proteinG: food.proteinG,
        carbsG: food.carbsG,
        fatG: food.fatG,
        fiberG: food.fiberG,
        isCustom: false,
        isIndian: true,
      },
    })
    inserted++
  }

  console.log(`✓ Inserted ${inserted}, skipped ${skipped} (already present)`)
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
