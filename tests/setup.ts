// react-native-gesture-handler mocked in setup-jest.js

// Mock Firebase
jest.mock('firebase/app', () => ({
  initializeApp: jest.fn(() => ({})),
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({ currentUser: null })),
  signInWithEmailAndPassword: jest.fn(),
  createUserWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  initializeAuth: jest.fn(),
  getReactNativePersistence: jest.fn(),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  collection: jest.fn(),
  getDocs: jest.fn(),
  addDoc: jest.fn(),
  updateDoc: jest.fn(),
  deleteDoc: jest.fn(),
  query: jest.fn(),
  where: jest.fn(),
  orderBy: jest.fn(),
  doc: jest.fn(),
  getDoc: jest.fn(),
  setDoc: jest.fn(),
}));

// Mock Expo modules
jest.mock('expo-secure-store');
jest.mock('expo-sqlite'); // Uses improved mock with better-sqlite3
jest.mock('@react-native-community/netinfo');
jest.mock('expo-constants', () => ({
  default: {
    expoConfig: {
      extra: {},
      scheme: 'granjaavicola',
      name: 'Granja Avícola',
      slug: 'granja-avicola',
      version: '1.0.0',
    },
    appOwnership: null,
  },
  expoConfig: {
    extra: {},
    scheme: 'granjaavicola',
    name: 'Granja Avícola',
    slug: 'granja-avicola',
    version: '1.0.0',
  },
  appOwnership: null,
}));
jest.mock('expo-linking', () => ({
  createURL: jest.fn((path: string) => `granjaavicola://${path}`),
  openURL: jest.fn(),
  canOpenURL: jest.fn(),
  addEventListener: jest.fn(),
}));
jest.mock('expo-application', () => ({
  androidId: 'test-android-id',
  getIosIdForVendorAsync: jest.fn().mockResolvedValue('test-ios-id'),
}), { virtual: true });
jest.mock('expo-router', () => ({
  useRouter: jest.fn(() => ({
    push: jest.fn(),
    replace: jest.fn(),
    back: jest.fn(),
  })),
  useLocalSearchParams: jest.fn(() => ({})),
  usePathname: jest.fn(() => '/'),
  Slot: 'Slot',
  Stack: 'Stack',
}));

// Silence console in tests
global.console = {
  ...console,
  error: jest.fn(),
  warn: jest.fn(),
};

// Setup fake timers
jest.useFakeTimers();
