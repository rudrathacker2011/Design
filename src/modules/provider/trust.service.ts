import { SEED_DESTINATIONS, type VerifiedStay } from '../destination/seed';

export interface NewReviewSubmission {
  destinationId: string;
  stayId: string;
  bookingVerificationToken: string;
  authorName: string;
  rating: number;
  comment: string;
  pricePaidInr: number;
}

export interface ReviewSubmissionResult {
  success: boolean;
  message: string;
  demoReference?: string;
  earnedYatraPoints?: number;
}

const delay = (ms: number) => new Promise((resolve) => setTimeout(resolve, ms));

export const trustService = {
  async getVerifiedStays(destinationId: string): Promise<VerifiedStay[]> {
    await delay(150);
    const dest = SEED_DESTINATIONS.find(d => d.id === destinationId) ?? SEED_DESTINATIONS[0];
    return dest.verifiedStays;
  },

  demoTokenForStay(stayId: string) {
    return `DEMO-STAY-${stayId.toUpperCase()}`;
  },

  async verifyStayToken(token: string, stayId: string): Promise<{ isValid: boolean; stayName?: string; checkinDate?: string }> {
    await delay(200);
    if (token.trim().toUpperCase() === this.demoTokenForStay(stayId)) {
      const stay = SEED_DESTINATIONS.flatMap((destination) => destination.verifiedStays).find((item) => item.id === stayId);
      if (!stay) return { isValid: false };
      return {
        isValid: true,
        stayName: stay.name,
        checkinDate: 'Illustrative completed stay (demo fixture)',
      };
    }
    return { isValid: false };
  },

  async submitVerifiedReview(data: NewReviewSubmission): Promise<ReviewSubmissionResult> {
    await delay(350);
    const eligibility = await this.verifyStayToken(data.bookingVerificationToken, data.stayId);
    if (!eligibility.isValid) {
      return {
        success: false,
        message: 'Review blocked: enter the exact completed-stay demo token shown for this stay. Tokens are fixtures and do not verify real bookings.',
      };
    }

    return {
      success: true,
      message: 'Demo review accepted for this illustrative completed stay. No real verification or tamper-evident ledger is connected.',
      demoReference: `DEMO-REVIEW-${data.stayId.toUpperCase()}-${data.rating}`,
      earnedYatraPoints: 250,
    };
  },
};
