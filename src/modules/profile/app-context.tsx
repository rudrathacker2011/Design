'use client';

import React, { createContext, useContext, useEffect, useRef, useState } from 'react';
import {
  SEED_DESTINATIONS,
  INITIAL_TRAVELLER_PROFILE,
  type Destination,
  type TravellerProfile,
} from '../destination/seed';
import type { DecisionEvaluateResponse } from '@/lib/api/client';
import type { OfflineTripPack } from '../safety/safety.service';
import { decisionService, type EvaluationResult } from '../decision/decision.service';
import { useAuth } from '@/modules/auth/AuthProvider';
import { apiClient } from '@/lib/api/client';

interface AppContextType {
  profile: TravellerProfile;
  setProfile: React.Dispatch<React.SetStateAction<TravellerProfile>>;
  selectedDestination: Destination;
  setSelectedDestinationId: (id: string) => void;
  evaluation: EvaluationResult | null;
  assessedDestination: DecisionEvaluateResponse['destination'] | null;
  evaluationStatus: 'idle' | 'loading' | 'success' | 'error';
  evaluationError: string | null;
  evaluateSelectedDestination: () => Promise<void>;
  offlinePacks: Record<string, OfflineTripPack>;
  saveOfflinePack: (destinationId: string, pack: OfflineTripPack) => void;
  yatraPoints: number;
  addYatraPoints: (points: number) => void;
  isSosActive: boolean;
  setIsSosActive: (active: boolean) => void;
  resetDemo: () => void;
  tripPlan: DemoTrip | null;
  createTripPlan: () => void;
  setTripDestination: (destinationId: string) => void;
  updateTripPlan: (patch: Partial<Pick<DemoTrip, 'origin' | 'travelDates' | 'partySize' | 'pace' | 'budget' | 'transportPreference'>>) => void;
  updateTripItem: (itemId: string, patch: Partial<Pick<DemoTripItem, 'day' | 'time' | 'title' | 'notes'>>) => void;
  simulateTripAdaptation: () => void;
  addTripItem: () => void;
  removeTripItem: (itemId: string) => void;
  demoReviews: DemoReview[];
  recordDemoReview: (review: DemoReview) => boolean;
  feedbackEntries: DemoFeedback[];
  recordFeedback: (feedback: DemoFeedback) => boolean;
  supportRequests: DemoSupportRequest[];
  recordSupportRequest: (request: DemoSupportRequest) => void;
  updateSupportRequestStatus: (id: string, status: DemoSupportRequest['status']) => void;
}

export interface DemoReview {
  stayId: string;
  authorName: string;
  rating: number;
  comment: string;
  pricePaidInr: number;
  submittedAt: string;
  demoReference: string;
}

export interface DemoFeedback {
  id: string;
  destinationId: string;
  destinationName: string;
  outcome: 'better' | 'as-expected' | 'worse' | 'not-travelled';
  actualCrowd: 'quiet' | 'moderate' | 'busy' | 'unknown';
  actualWeather: 'good' | 'mixed' | 'poor' | 'unknown';
  note: string;
  submittedAt: string;
}

export interface DemoSupportRequest {
  id: string;
  reference: string;
  kind: 'sos' | 'mechanic' | 'rental';
  destinationId: string;
  destinationName: string;
  detail: string;
  status: 'recorded' | 'acknowledged' | 'closed';
  createdAt: string;
}

export interface DemoTripItem {
  id: string;
  day: number;
  time: string;
  title: string;
  notes: string;
}

export interface DemoTrip {
  id: string;
  destinationId: string;
  destinationName: string;
  origin: string;
  travelDates: string;
  partySize: number;
  pace: TravellerProfile['pace'];
  budget: TravellerProfile['budget'];
  transportPreference: TravellerProfile['transportPreference'];
  version: number;
  adaptationCount: number;
  adaptationNote?: string;
  items: DemoTripItem[];
  updatedAt: string;
}

const AppContext = createContext<AppContextType | undefined>(undefined);

export function AppProvider({ children }: { children: React.ReactNode }) {
  const { session } = useAuth();
  const [profileState, setProfileState] = useState<TravellerProfile>(INITIAL_TRAVELLER_PROFILE);
  const [selectedDestination, setSelectedDestination] = useState<Destination>(SEED_DESTINATIONS[0]);
  const [evaluation, setEvaluation] = useState<EvaluationResult | null>(null);
  const [assessedDestination, setAssessedDestination] = useState<DecisionEvaluateResponse['destination'] | null>(null);
  const [evaluationStatus, setEvaluationStatus] = useState<AppContextType['evaluationStatus']>('idle');
  const [evaluationError, setEvaluationError] = useState<string | null>(null);
  const [offlinePacks, setOfflinePacks] = useState<Record<string, OfflineTripPack>>({});
  const [yatraPoints, setYatraPoints] = useState<number>(350);
  const [isSosActive, setIsSosActive] = useState<boolean>(false);
  const [tripPlan, setTripPlan] = useState<DemoTrip | null>(null);
  const [demoReviews, setDemoReviews] = useState<DemoReview[]>([]);
  const [feedbackEntries, setFeedbackEntries] = useState<DemoFeedback[]>([]);
  const [supportRequests, setSupportRequests] = useState<DemoSupportRequest[]>([]);
  const [hydrated, setHydrated] = useState(false);
  const requestId = useRef(0);

  useEffect(() => {
    try {
      const saved = window.localStorage.getItem('yatrasetu-demo-state-v2') ?? window.localStorage.getItem('yatrasetu-demo-state-v1');
      if (saved) {
        const state = JSON.parse(saved) as {
          profile?: TravellerProfile;
          destinationId?: string;
          offlinePacks?: Record<string, OfflineTripPack>;
          yatraPoints?: number;
          tripPlan?: DemoTrip | null;
          demoReviews?: DemoReview[];
          feedbackEntries?: DemoFeedback[];
          supportRequests?: DemoSupportRequest[];
        };
        if (state.profile && typeof state.profile === 'object') setProfileState({ ...INITIAL_TRAVELLER_PROFILE, ...state.profile });
        const destination = SEED_DESTINATIONS.find((item) => item.id === state.destinationId);
        if (destination) setSelectedDestination(destination);
        if (state.offlinePacks && typeof state.offlinePacks === 'object') setOfflinePacks(state.offlinePacks);
        if (typeof state.yatraPoints === 'number' && Number.isFinite(state.yatraPoints)) setYatraPoints(state.yatraPoints);
        if (state.tripPlan && typeof state.tripPlan === 'object' && Array.isArray(state.tripPlan.items)) setTripPlan({ ...state.tripPlan, adaptationCount: typeof state.tripPlan.adaptationCount === 'number' ? state.tripPlan.adaptationCount : 0 });
        if (Array.isArray(state.demoReviews)) setDemoReviews(state.demoReviews);
        if (Array.isArray(state.feedbackEntries)) setFeedbackEntries(state.feedbackEntries);
        if (Array.isArray(state.supportRequests)) setSupportRequests(state.supportRequests);
      }
    } catch {
      window.localStorage.removeItem('yatrasetu-demo-state-v1');
    } finally {
      setHydrated(true);
    }
  }, []);

  useEffect(() => {
    if (!hydrated || !session?.access_token) return;
    let active = true;
    void apiClient.getProfile(session.access_token).then((saved) => {
      if (!active) return;
      setProfileState((current) => ({
        ...current,
        pace: saved.travelPace === 'RELAXED' ? 'slow' : saved.travelPace === 'FAST' ? 'fast' : 'balanced',
        crowdPreference: saved.crowdPreference === 'SEEK_QUIET' ? 'quiet' : saved.crowdPreference === 'DONT_CARE' ? 'lively' : 'balanced',
        accessibilityNeeded: saved.accessibilityNeeds,
        transportPreference: (saved.transportPreference as TravellerProfile['transportPreference']) ?? current.transportPreference,
      }));
    }).catch((error: unknown) => {
      const code = error instanceof Error && 'code' in error ? (error as Error & { code?: string }).code : undefined;
      if (code !== 'NOT_FOUND') console.error('[profile:load]', error);
    });
    return () => {
      active = false;
    };
  }, [hydrated, session?.access_token]);

  useEffect(() => {
    if (!hydrated) return;
    try {
      window.localStorage.setItem('yatrasetu-demo-state-v2', JSON.stringify({
        profile: profileState,
        destinationId: selectedDestination.id,
        offlinePacks,
        yatraPoints,
        tripPlan,
        demoReviews,
        feedbackEntries,
        supportRequests,
      }));
    } catch {
      // The demo remains usable if browser storage is unavailable or full.
    }
  }, [hydrated, profileState, selectedDestination.id, offlinePacks, yatraPoints, tripPlan, demoReviews, feedbackEntries, supportRequests]);

  const invalidateEvaluation = () => {
    requestId.current += 1;
    setEvaluation(null);
    setAssessedDestination(null);
    setEvaluationStatus('idle');
    setEvaluationError(null);
  };

  const setProfile: React.Dispatch<React.SetStateAction<TravellerProfile>> = (next) => {
    setProfileState(next);
    invalidateEvaluation();
  };

  const setSelectedDestinationId = (id: string) => {
    const found = SEED_DESTINATIONS.find((destination) => destination.id === id);
    if (found) {
      setSelectedDestination(found);
      invalidateEvaluation();
    }
  };

  const evaluateSelectedDestination = async () => {
    const currentRequest = ++requestId.current;
    setEvaluation(null);
    setEvaluationError(null);
    setEvaluationStatus('loading');
    try {
      const result = await decisionService.evaluateDestination(profileState, selectedDestination);
      if (requestId.current === currentRequest) {
        setEvaluation(result.evaluation);
        setAssessedDestination(result.destination);
        setEvaluationStatus('success');
      }
    } catch (error) {
      if (requestId.current === currentRequest) {
        setEvaluationError(error instanceof Error ? error.message : 'Destination assessment failed. Try again.');
        setEvaluationStatus('error');
      }
    }
  };

  const saveOfflinePack = (destinationId: string, pack: OfflineTripPack) => {
    setOfflinePacks((previous) => ({ ...previous, [destinationId]: pack }));
  };

  const addYatraPoints = (points: number) => setYatraPoints((prev) => prev + points);

  const createTripPlan = () => {
    const items: DemoTripItem[] = [
      { id: `${Date.now()}-1`, day: 1, time: '09:00', title: 'Plan an activity for your trip intent', notes: profileState.experienceIntent },
      { id: `${Date.now()}-2`, day: 1, time: '13:00', title: 'Add a meal or rest break', notes: 'Choose a place after checking current opening and price information.' },
      { id: `${Date.now()}-3`, day: 2, time: '10:00', title: 'Add another activity', notes: 'Keep this plan flexible; demo data does not confirm availability.' },
    ];
    setTripPlan({
      id: `demo-trip-${Date.now()}`,
      destinationId: selectedDestination.id,
      destinationName: selectedDestination.name,
      origin: 'Ahmedabad Junction',
      travelDates: profileState.travelDates,
      partySize: profileState.partySize,
      pace: profileState.pace,
      budget: profileState.budget,
      transportPreference: profileState.transportPreference,
      version: 1,
      adaptationCount: 0,
      items,
      updatedAt: new Date().toISOString(),
    });
  };

  const setTripDestination = (destinationId: string) => {
    const destination = SEED_DESTINATIONS.find((item) => item.id === destinationId);
    if (!destination) return;
    setSelectedDestination(destination);
    invalidateEvaluation();
    setTripPlan((current) => current ? {
      ...current,
      destinationId: destination.id,
      destinationName: destination.name,
      version: current.version + 1,
      updatedAt: new Date().toISOString(),
    } : current);
  };

  const updateTripPlan: AppContextType['updateTripPlan'] = (patch) => setTripPlan((current) => current ? { ...current, ...patch, version: current.version + 1, updatedAt: new Date().toISOString() } : current);
  const updateTripItem: AppContextType['updateTripItem'] = (itemId, patch) => setTripPlan((current) => current ? {
    ...current,
    items: current.items.map((item) => item.id === itemId ? { ...item, ...patch } : item),
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  } : current);
  const addTripItem = () => setTripPlan((current) => current ? {
    ...current,
    items: [...current.items, { id: `demo-item-${Date.now()}`, day: 1, time: '15:00', title: '', notes: '' }],
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  } : current);
  const removeTripItem = (itemId: string) => setTripPlan((current) => current ? {
    ...current,
    items: current.items.filter((item) => item.id !== itemId),
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  } : current);
  const simulateTripAdaptation = () => setTripPlan((current) => current ? {
    ...current,
    items: [...current.items, {
      id: `demo-adaptation-${Date.now()}`,
      day: Math.max(...current.items.map((item) => item.day), 1),
      time: '16:00',
      title: 'Flexible alternative after a reality change',
      notes: 'Demo adaptation: the original plan conflicted with a simulated access or weather change. Review this suggestion before using it.',
    }],
    adaptationCount: current.adaptationCount + 1,
    adaptationNote: 'A simulated destination change created a new draft suggestion. Nothing was silently replaced.',
    version: current.version + 1,
    updatedAt: new Date().toISOString(),
  } : current);

  const recordDemoReview = (review: DemoReview) => {
    if (demoReviews.some((saved) => saved.stayId === review.stayId)) return false;
    setDemoReviews((previous) => previous.some((saved) => saved.stayId === review.stayId) ? previous : [...previous, review]);
    setYatraPoints((previous) => previous + 250);
    return true;
  };

  const recordFeedback = (feedback: DemoFeedback) => {
    if (feedbackEntries.some((entry) => entry.id === feedback.id || entry.destinationId === feedback.destinationId)) return false;
    setFeedbackEntries((previous) => previous.some((entry) => entry.destinationId === feedback.destinationId) ? previous : [...previous, feedback]);
    setYatraPoints((previous) => previous + 150);
    return true;
  };

  const recordSupportRequest = (request: DemoSupportRequest) => {
    setSupportRequests((previous) => previous.some((item) => item.id === request.id || item.reference === request.reference) ? previous : [...previous, request]);
  };

  const updateSupportRequestStatus = (id: string, status: DemoSupportRequest['status']) => {
    setSupportRequests((previous) => previous.map((request) => request.id === id ? { ...request, status } : request));
  };

  const resetDemo = () => {
    window.localStorage.removeItem('yatrasetu-demo-state-v2');
    window.localStorage.removeItem('yatrasetu-demo-state-v1');
    requestId.current += 1;
    setProfileState(INITIAL_TRAVELLER_PROFILE);
    setSelectedDestination(SEED_DESTINATIONS[0]);
    setEvaluation(null);
    setAssessedDestination(null);
    setEvaluationStatus('idle');
    setEvaluationError(null);
    setOfflinePacks({});
    setYatraPoints(350);
    setIsSosActive(false);
    setTripPlan(null);
    setDemoReviews([]);
    setFeedbackEntries([]);
    setSupportRequests([]);
  };

  return (
    <AppContext.Provider
      value={{
        profile: profileState,
        setProfile,
        selectedDestination,
        setSelectedDestinationId,
        evaluation,
        assessedDestination,
        evaluationStatus,
        evaluationError,
        evaluateSelectedDestination,
        offlinePacks,
        saveOfflinePack,
        yatraPoints,
        addYatraPoints,
        isSosActive,
        setIsSosActive,
        resetDemo,
        tripPlan,
        createTripPlan,
        setTripDestination,
        updateTripPlan,
        updateTripItem,
        simulateTripAdaptation,
        addTripItem,
        removeTripItem,
        demoReviews,
        recordDemoReview,
        feedbackEntries,
        recordFeedback,
        supportRequests,
        recordSupportRequest,
        updateSupportRequestStatus,
      }}
    >
      {children}
    </AppContext.Provider>
  );
}

export function useApp() {
  const context = useContext(AppContext);
  if (!context) throw new Error('useApp must be used within an AppProvider');
  return context;
}
