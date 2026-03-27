import { PrismaClient } from '@prisma/client'
import bcrypt from 'bcryptjs'

const prisma = new PrismaClient()

async function main() {
  console.warn('Seeding database...')

  // Create test organizer
  const passwordHash = await bcrypt.hash('TestOrganizer123!', 12)

  const organizer = await prisma.user.upsert({
    where: { email: 'organizer@ayeye.test' },
    update: {},
    create: {
      email: 'organizer@ayeye.test',
      name: 'Test Organizer',
      passwordHash,
      role: 'ORGANIZER',
    },
  })

  console.warn(`Created organizer: ${organizer.email}`)

  // Create test event (date in the future)
  const eventDate = new Date()
  eventDate.setMonth(eventDate.getMonth() + 3)

  const event = await prisma.event.upsert({
    where: { registrationLink: 'test-devfest-2026' },
    update: {},
    create: {
      name: 'DevFest Lagos 2026 (Test)',
      description: 'Annual developer festival — seeded test event',
      date: eventDate,
      venue: 'Landmark Event Centre, Lagos',
      depositAmount: 200000, // ₦2,000 in kobo
      noShowPolicy: 'CHARITY',
      maxAttendees: 300,
      organizerId: organizer.id,
      status: 'PUBLISHED',
      registrationLink: 'test-devfest-2026',
    },
  })

  console.warn(`Created event: ${event.name} (link: ${event.registrationLink})`)
  console.warn('Seeding complete.')
}

main()
  .catch((e) => {
    console.error(e)
    process.exit(1)
  })
  .finally(() => {
    void prisma.$disconnect()
  })
