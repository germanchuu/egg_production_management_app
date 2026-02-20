/**
 * EventHistoryList Component (T140)
 *
 * Displays health or biosecurity events grouped by date, chronological desc.
 * Each row shows: product name, lot name (if health event), notes preview.
 */

import React, { useMemo } from 'react';
import { View, Text } from 'react-native';
import { MotiView } from 'moti';
import { Calendar, Syringe, Shield, FileText } from 'lucide-react-native';
import { theme } from '@/core/theme';
import { HealthEvent } from '../models/HealthEvent';
import { BiosecurityEvent } from '../models/BiosecurityEvent';
import { ChickenLot } from '@/shared/types/entities';

export type AnyEvent = (HealthEvent & { lotName?: string }) | BiosecurityEvent;

interface EventHistoryListProps {
  events: AnyEvent[];
  lots?: ChickenLot[];
  emptyMessage?: string;
  emptyIcon?: 'health' | 'biosecurity';
}

// ─── EventCard ───────────────────────────────────────────────────────────────

interface EventCardProps {
  event: AnyEvent;
  index: number;
  isLast: boolean;
}

const EventCard: React.FC<EventCardProps> = ({ event, index, isLast }) => {
  const isHealth = event.eventType === 'vaccination';
  const lotName = isHealth
    ? (event as HealthEvent & { lotName?: string }).lotName
    : undefined;

  return (
    <View
      className={`px-lg py-md flex-row items-start gap-md ${!isLast ? 'border-b border-gray-100' : ''}`}
    >
      <View
        className={`w-9 h-9 rounded-full items-center justify-center mt-xs ${
          isHealth ? 'bg-primary-100' : 'bg-teal-100'
        }`}
      >
        {isHealth ? (
          <Syringe size={16} color={theme.colors.primary['600']} />
        ) : (
          <Shield size={16} color="#0D9488" />
        )}
      </View>

      <View className="flex-1">
        <Text className="text-sm font-semibold text-textPrimary">
          {event.productName}
        </Text>

        {lotName && (
          <Text className="text-xs text-primary-600 mt-xs">
            Lote: {lotName}
          </Text>
        )}

        {event.notes ? (
          <View className="flex-row items-start gap-xs mt-xs">
            <View className="translate-y-0.5">
              <FileText size={12} color={theme.colors.gray['400']} />
            </View>
            <Text
              className="text-xs text-textSecondary flex-1"
              numberOfLines={2}
            >
              {event.notes}
            </Text>
          </View>
        ) : null}
      </View>

      <Text className="text-xs text-textTertiary mt-xs">
        {new Date(event.createdAt).toLocaleTimeString('es-ES', {
          hour: '2-digit',
          minute: '2-digit',
        })}
      </Text>
    </View>
  );
};

// ─── EventHistoryList ─────────────────────────────────────────────────────────

export const EventHistoryList: React.FC<EventHistoryListProps> = ({
  events,
  lots = [],
  emptyMessage = 'No hay eventos registrados',
  emptyIcon = 'health',
}) => {
  const enrichedEvents = useMemo<AnyEvent[]>(() => {
    return events.map((event) => {
      if (event.eventType === 'vaccination') {
        const healthEvent = event as HealthEvent;
        const lot = lots.find((l) => l.id === healthEvent.lotId);
        return { ...healthEvent, lotName: lot?.name };
      }
      return event;
    });
  }, [events, lots]);

  const grouped = useMemo(() => {
    const map = new Map<string, AnyEvent[]>();
    enrichedEvents.forEach((ev) => {
      const key = ev.eventDate.split('T')[0];
      if (!map.has(key)) map.set(key, []);
      map.get(key)!.push(ev);
    });
    return new Map(
      Array.from(map.entries()).sort((a, b) => b[0].localeCompare(a[0]))
    );
  }, [enrichedEvents]);

  if (events.length === 0) {
    return (
      <View className="bg-white rounded-md border border-gray-200 px-xl py-2xl items-center">
        <View className="w-16 h-16 rounded-full bg-gray-100 items-center justify-center mb-md">
          {emptyIcon === 'health' ? (
            <Syringe size={32} color={theme.colors.gray['400']} />
          ) : (
            <Shield size={32} color={theme.colors.gray['400']} />
          )}
        </View>
        <Text className="text-textTertiary text-center">{emptyMessage}</Text>
      </View>
    );
  }

  return (
    <View className="gap-md">
      {Array.from(grouped.entries()).map(([dateKey, dayEvents], groupIndex) => (
        <MotiView
          key={dateKey}
          from={{ opacity: 0, translateY: 20 }}
          animate={{ opacity: 1, translateY: 0 }}
          transition={{ type: 'timing', duration: 250, delay: groupIndex * 50 }}
        >
          <View className="bg-white rounded-md border border-gray-200 overflow-hidden shadow-sm">
            {/* Day header */}
            <View className="bg-primary-50 px-lg py-md border-b border-primary-100">
              <View className="flex-row items-center justify-between">
                <View className="flex-row items-center gap-sm flex-1">
                  <Calendar size={16} color={theme.colors.primary['600']} />
                  <Text className="text-sm font-semibold text-primary-700">
                    {new Date(dateKey + 'T12:00:00').toLocaleDateString(
                      'es-ES',
                      {
                        day: '2-digit',
                        month: 'long',
                        year: 'numeric',
                      }
                    )}
                  </Text>
                </View>
                {dayEvents.length > 1 && (
                  <Text className="text-xs text-primary-500">
                    {dayEvents.length} eventos
                  </Text>
                )}
              </View>
            </View>

            {/* Event rows */}
            {dayEvents.map((event, idx) => (
              <EventCard
                key={event.id}
                event={event}
                index={idx}
                isLast={idx === dayEvents.length - 1}
              />
            ))}
          </View>
        </MotiView>
      ))}
    </View>
  );
};
