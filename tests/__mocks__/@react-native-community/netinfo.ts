let netInfoState = {
  isConnected: true,
  isInternetReachable: true,
  type: 'wifi' as const,
  details: null
};

export const fetch = jest.fn(() => Promise.resolve(netInfoState));

export const addEventListener = jest.fn(() => jest.fn());

export const setNetworkState = (state: Partial<typeof netInfoState>) => {
  netInfoState = { ...netInfoState, ...state };
};

export const __resetNetworkState = () => {
  netInfoState = {
    isConnected: true,
    isInternetReachable: true,
    type: 'wifi' as const,
    details: null
  };
};
