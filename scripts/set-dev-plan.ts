/**
 * Dev-only helper: upgrades a local user's subscription to PRO so AI/resume
 * usage limits (services/subscription.service.ts) don't block local testing.
 *
 * Usage: npx tsx scripts/set-dev-plan.ts <email> [plan]
 *   plan defaults to PRO. Valid values: FREE | PRO | TEAM
 */
import { prisma } from "@/lib/prisma";

async function main() {
  const email = process.argv[2];
  const plan = (process.argv[3] ?? "PRO").toUpperCase();

  if (!email) {
    console.error("Usage: npx tsx scripts/set-dev-plan.ts <email> [plan]");
    process.exit(1);
  }

  if (!["FREE", "PRO", "TEAM"].includes(plan)) {
    console.error(`Invalid plan "${plan}". Use FREE, PRO, or TEAM.`);
    process.exit(1);
  }

  const user = await prisma.user.findUnique({ where: { email } });

  if (!user) {
    console.error(`No user found with email ${email}`);
    process.exit(1);
  }

  const subscription = await prisma.subscription.upsert({
    where: { userId: user.id },
    create: { userId: user.id, plan, status: "ACTIVE" },
    update: { plan, status: "ACTIVE" },
  });

  console.log(`Set plan=${subscription.plan} for ${email}`);
}

main()
  .catch((error) => {
    console.error(error);
    process.exit(1);
  })
  .finally(() => prisma.$disconnect());
