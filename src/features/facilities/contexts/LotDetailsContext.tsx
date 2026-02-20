import React, { createContext, useContext } from 'react';
import { ChickenLot, MortalityRecord, ProductionRecord } from '@/shared/types/entities';
import { HealthEvent } from '@/features/health-biosecurity/models/HealthEvent';
import { BiosecurityEvent } from '@/features/health-biosecurity/models/BiosecurityEvent';
import { ProductionMetrics } from '@/features/production/components/ProductionMetricsCard';
import { FeedBatchWithRemaining, FeedingRecordWithMetrics } from '@/features/feeding/services/FeedingService';

export interface LotDetailsContextValue {
  lot: ChickenLot;
  loading: boolean;
  mortalityHistory: MortalityRecord[];
  productionHistory: ProductionRecord[];
  productionMetrics: ProductionMetrics | null;
  feedingHistory: FeedingRecordWithMetrics[];
  feedBatches: FeedBatchWithRemaining[];
  totalFeedConsumed: number;
  avgFeedPerHen: number;
  healthEvents: HealthEvent[];
  biosecurityEvents: BiosecurityEvent[];
}

const LotDetailsContext = createContext<LotDetailsContextValue | null>(null);

export const useLotDetails = (): LotDetailsContextValue => {
  const ctx = useContext(LotDetailsContext);
  if (!ctx) throw new Error('useLotDetails must be used within LotDetailsProvider');
  return ctx;
};

export const LotDetailsProvider = LotDetailsContext.Provider;
