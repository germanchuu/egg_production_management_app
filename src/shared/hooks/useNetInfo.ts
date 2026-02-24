/**
 * useNetInfo Hook
 *
 * React hook for detecting network connectivity using @react-native-community/netinfo.
 *
 * Provides real-time network state information:
 * - isConnected: Whether the device is connected to a network
 * - isInternetReachable: Whether internet is actually reachable (not just connected)
 * - type: Network type (wifi, cellular, ethernet, etc.)
 *
 * Usage:
 * ```typescript
 * import { useNetInfo } from '@/shared/hooks/useNetInfo';
 *
 * function MyComponent() {
 *   const { isConnected, isInternetReachable, type } = useNetInfo();
 *
 *   if (!isConnected) {
 *     return <Text>You are offline</Text>;
 *   }
 *
 *   if (!isInternetReachable) {
 *     return <Text>No internet access</Text>;
 *   }
 *
 *   return <Text>Connected via {type}</Text>;
 * }
 * ```
 */

import { useEffect, useState } from 'react';
import NetInfo, { NetInfoState } from '@react-native-community/netinfo';

/**
 * Network information state
 */
export interface NetworkInfo {
  isConnected: boolean | null;
  isInternetReachable: boolean | null;
  type: string;
}

/**
 * Hook for monitoring network connectivity
 *
 * Automatically subscribes to network state changes on mount
 * and unsubscribes on unmount.
 *
 * @returns Current network state
 */
export function useNetInfo(): NetworkInfo {
  const [networkInfo, setNetworkInfo] = useState<NetworkInfo>({
    isConnected: null,
    isInternetReachable: null,
    type: 'unknown',
  });

  useEffect(() => {
    // Fetch initial network state
    NetInfo.fetch().then((state: NetInfoState) => {
      setNetworkInfo({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Subscribe to network state changes
    const unsubscribe = NetInfo.addEventListener((state: NetInfoState) => {
      setNetworkInfo({
        isConnected: state.isConnected,
        isInternetReachable: state.isInternetReachable,
        type: state.type,
      });
    });

    // Cleanup subscription on unmount
    return () => {
      unsubscribe();
    };
  }, []);

  return networkInfo;
}
