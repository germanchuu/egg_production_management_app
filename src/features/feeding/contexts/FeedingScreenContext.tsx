import React, { createContext, useContext } from 'react';
import { ChickenLot } from '@/shared/types/entities';
import { FeedBatchWithRemaining, FeedingRecordWithMetrics } from '../services/FeedingService';
import { FeedingRecordFormData, FeedBatchFormData } from '../utils/validation';

export interface FeedingScreenContextValue {
  lots: ChickenLot[];
  feedBatches: FeedBatchWithRemaining[];
  recentRecords: FeedingRecordWithMetrics[];
  loading: boolean;
  isSubmitting: boolean;
  onRecordFeeding: (data: FeedingRecordFormData) => Promise<void>;
  onCreateBatch: (data: FeedBatchFormData) => Promise<void>;
}

const FeedingScreenContext = createContext<FeedingScreenContextValue | null>(null);

export const useFeedingScreen = (): FeedingScreenContextValue => {
  const ctx = useContext(FeedingScreenContext);
  if (!ctx) throw new Error('useFeedingScreen must be used within FeedingScreenProvider');
  return ctx;
};

export const FeedingScreenProvider = FeedingScreenContext.Provider;
