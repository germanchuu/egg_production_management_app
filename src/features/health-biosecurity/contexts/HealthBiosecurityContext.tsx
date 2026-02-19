import React, { createContext, useContext } from 'react';
import { ChickenLot } from '@/shared/types/entities';
import { HealthEvent } from '../models/HealthEvent';
import { BiosecurityEvent } from '../models/BiosecurityEvent';
import { HealthEventFormData, BiosecurityEventFormData } from '../utils/validation';

export interface HealthBiosecurityContextValue {
  lots: ChickenLot[];
  healthEvents: HealthEvent[];
  biosecurityEvents: BiosecurityEvent[];
  loading: boolean;
  isSubmitting: boolean;
  onRecordHealthEvent: (data: HealthEventFormData) => Promise<void>;
  onRecordBiosecurityEvent: (data: BiosecurityEventFormData) => Promise<void>;
}

const HealthBiosecurityContext = createContext<HealthBiosecurityContextValue | null>(null);

export const useHealthBiosecurity = (): HealthBiosecurityContextValue => {
  const ctx = useContext(HealthBiosecurityContext);
  if (!ctx) throw new Error('useHealthBiosecurity must be used within HealthBiosecurityProvider');
  return ctx;
};

export const HealthBiosecurityProvider = HealthBiosecurityContext.Provider;
