import { prisma } from '../../lib/db.js';

// ============================================================
// Profile Service — manages TravellerProfile creation & updates
// ============================================================

interface ProfileInput {
  budgetMin?: number;
  budgetMax?: number;
  travelPace?: string;
  crowdPreference?: string;
  accessibilityNeeds?: boolean;
  transportPreference?: string;
  vehicleRequired?: boolean;
  languagePreference?: string;
  experienceTags?: string[];
}

export class ProfileService {
  static async getProfileByUserId(userId: string) {
    return prisma.travellerProfile.findUnique({ where: { userId } });
  }

  static async upsertProfile(userId: string, data: ProfileInput) {
    return prisma.travellerProfile.upsert({
      where: { userId },
      update: {
        ...data,
        travelPace: data.travelPace as any,
        crowdPreference: data.crowdPreference as any,
        updatedAt: new Date(),
      },
      create: {
        userId,
        travelPace: (data.travelPace as any) ?? 'BALANCED',
        crowdPreference: (data.crowdPreference as any) ?? 'MODERATE',
        accessibilityNeeds: data.accessibilityNeeds ?? false,
        vehicleRequired: data.vehicleRequired ?? false,
        languagePreference: data.languagePreference ?? 'en',
        budgetMin: data.budgetMin,
        budgetMax: data.budgetMax,
        transportPreference: data.transportPreference,
        experienceTags: data.experienceTags ?? [],
      },
    });
  }

  static async addExperienceTags(userId: string, tags: string[]) {
    const profile = await this.getProfileByUserId(userId);
    if (!profile) return null;
    const existing = new Set(profile.experienceTags);
    tags.forEach(t => existing.add(t));
    return prisma.travellerProfile.update({
      where: { userId },
      data: { experienceTags: [...existing] },
    });
  }
}
