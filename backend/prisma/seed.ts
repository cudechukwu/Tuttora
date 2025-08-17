import { PrismaClient, BadgeCategory, BadgeRarity, BadgeRequirementType } from '@prisma/client';

const prisma = new PrismaClient();

async function main() {
  console.log('🌱 Seeding gamification data...');

  // Create badges
  const badges = [
    // Session badges
    {
      name: 'First Steps',
      description: 'Complete your first tutoring session',
      icon: '🎯',
      category: BadgeCategory.SESSIONS,
      rarity: BadgeRarity.COMMON,
      points: 50,
      requirementType: BadgeRequirementType.SESSIONS_COMPLETED,
      requirementValue: 1
    },
    {
      name: 'Dedicated Tutor',
      description: 'Complete 10 tutoring sessions',
      icon: '📚',
      category: BadgeCategory.SESSIONS,
      rarity: BadgeRarity.UNCOMMON,
      points: 200,
      requirementType: BadgeRequirementType.SESSIONS_COMPLETED,
      requirementValue: 10
    },
    {
      name: 'Master Educator',
      description: 'Complete 50 tutoring sessions',
      icon: '👨‍🏫',
      category: BadgeCategory.SESSIONS,
      rarity: BadgeRarity.RARE,
      points: 500,
      requirementType: BadgeRequirementType.SESSIONS_COMPLETED,
      requirementValue: 50
    },
    {
      name: 'Legendary Mentor',
      description: 'Complete 100 tutoring sessions',
      icon: '🏆',
      category: BadgeCategory.SESSIONS,
      rarity: BadgeRarity.LEGENDARY,
      points: 1000,
      requirementType: BadgeRequirementType.SESSIONS_COMPLETED,
      requirementValue: 100
    },

    // Rating badges
    {
      name: 'Star Performer',
      description: 'Achieve a 4.5+ average rating',
      icon: '⭐',
      category: BadgeCategory.RATING,
      rarity: BadgeRarity.UNCOMMON,
      points: 300,
      requirementType: BadgeRequirementType.RATING_ACHIEVED,
      requirementValue: 45 // 4.5 * 10 for integer storage
    },
    {
      name: 'Perfect Score',
      description: 'Achieve a 5.0 average rating',
      icon: '🌟',
      category: BadgeCategory.RATING,
      rarity: BadgeRarity.EPIC,
      points: 750,
      requirementType: BadgeRequirementType.RATING_ACHIEVED,
      requirementValue: 50 // 5.0 * 10
    },

    // Streak badges
    {
      name: 'Week Warrior',
      description: 'Maintain a 7-day activity streak',
      icon: '🔥',
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.UNCOMMON,
      points: 150,
      requirementType: BadgeRequirementType.STREAK_DAYS,
      requirementValue: 7
    },
    {
      name: 'Month Master',
      description: 'Maintain a 30-day activity streak',
      icon: '💪',
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.RARE,
      points: 400,
      requirementType: BadgeRequirementType.STREAK_DAYS,
      requirementValue: 30
    },
    {
      name: 'Streak Legend',
      description: 'Maintain a 100-day activity streak',
      icon: '⚡',
      category: BadgeCategory.STREAK,
      rarity: BadgeRarity.LEGENDARY,
      points: 1500,
      requirementType: BadgeRequirementType.STREAK_DAYS,
      requirementValue: 100
    },

    // Activity badges
    {
      name: 'Chat Champion',
      description: 'Send 100 messages',
      icon: '💬',
      category: BadgeCategory.MESSAGES,
      rarity: BadgeRarity.COMMON,
      points: 100,
      requirementType: BadgeRequirementType.MESSAGES_SENT,
      requirementValue: 100
    },
    {
      name: 'Communication Expert',
      description: 'Send 500 messages',
      icon: '📢',
      category: BadgeCategory.MESSAGES,
      rarity: BadgeRarity.UNCOMMON,
      points: 250,
      requirementType: BadgeRequirementType.MESSAGES_SENT,
      requirementValue: 500
    },
    {
      name: 'File Sharer',
      description: 'Share 10 files',
      icon: '📁',
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.COMMON,
      points: 75,
      requirementType: BadgeRequirementType.FILES_SHARED,
      requirementValue: 10
    },
    {
      name: 'Whiteboard Artist',
      description: 'Use whiteboard in 5 sessions',
      icon: '🎨',
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.UNCOMMON,
      points: 150,
      requirementType: BadgeRequirementType.WHITEBOARD_SESSIONS,
      requirementValue: 5
    },
    {
      name: 'Code Collaborator',
      description: 'Use code editor in 5 sessions',
      icon: '💻',
      category: BadgeCategory.SPECIAL,
      rarity: BadgeRarity.UNCOMMON,
      points: 150,
      requirementType: BadgeRequirementType.CODE_SESSIONS,
      requirementValue: 5
    },

    // Milestone badges
    {
      name: 'Point Collector',
      description: 'Earn 1000 points',
      icon: '💰',
      category: BadgeCategory.MILESTONE,
      rarity: BadgeRarity.COMMON,
      points: 100,
      requirementType: BadgeRequirementType.POINTS_EARNED,
      requirementValue: 1000
    },
    {
      name: 'Point Master',
      description: 'Earn 5000 points',
      icon: '💎',
      category: BadgeCategory.MILESTONE,
      rarity: BadgeRarity.RARE,
      points: 500,
      requirementType: BadgeRequirementType.POINTS_EARNED,
      requirementValue: 5000
    },
    {
      name: 'Point Legend',
      description: 'Earn 10000 points',
      icon: '👑',
      category: BadgeCategory.MILESTONE,
      rarity: BadgeRarity.LEGENDARY,
      points: 1000,
      requirementType: BadgeRequirementType.POINTS_EARNED,
      requirementValue: 10000
    }
  ];

  for (const badge of badges) {
    await prisma.badge.upsert({
      where: { name: badge.name },
      update: badge,
      create: badge
    });
  }

  console.log(`✅ Created ${badges.length} badges`);

  // Create user stats for existing users
  const users = await prisma.user.findMany({
    where: {
      userStats: null
    }
  });

  for (const user of users) {
    await prisma.userStats.create({
      data: {
        userId: user.id,
        totalPoints: 0,
        currentLevel: 1,
        experiencePoints: 0,
        totalSessions: 0,
        completedSessions: 0,
        totalTutoringTime: 0,
        averageRating: 0,
        totalMessages: 0,
        filesShared: 0,
        whiteboardSessions: 0,
        codeSessions: 0,
        currentStreak: 0,
        longestStreak: 0,
        lastActivityDate: new Date()
      }
    });
  }

  console.log(`✅ Created user stats for ${users.length} users`);

  console.log('🎉 Gamification seeding completed!');
}

main()
  .catch((e) => {
    console.error('❌ Seeding failed:', e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  }); 