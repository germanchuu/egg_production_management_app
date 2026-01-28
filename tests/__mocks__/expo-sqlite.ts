const mockDb = {
  execAsync: jest.fn().mockResolvedValue(undefined),
  getAllAsync: jest.fn().mockResolvedValue([]),
  getFirstAsync: jest.fn().mockResolvedValue(null),
  runAsync: jest.fn().mockResolvedValue({ lastInsertRowId: 1, changes: 1 }),
  closeAsync: jest.fn().mockResolvedValue(undefined),
};

export const openDatabaseAsync = jest.fn().mockResolvedValue(mockDb);

export const __getMockDb = () => mockDb;
export const __resetMockDb = () => {
  mockDb.execAsync.mockReset();
  mockDb.getAllAsync.mockReset();
  mockDb.getFirstAsync.mockReset();
  mockDb.runAsync.mockReset();
  mockDb.closeAsync.mockReset();
};
