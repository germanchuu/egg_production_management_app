import { useMemo } from 'react';
import { User, AuthStatus, UserRole } from '@/shared/types/entities';

export const useFilteredUsers = (
  users: User[],
  searchQuery: string,
  authStatusFilter: AuthStatus | 'all',
  roleFilter: UserRole | 'all',
  sortBy: 'name' | 'createdAt' | 'lastAccessAt',
  sortOrder: 'asc' | 'desc'
) => {
  return useMemo(() => {
    let filtered = [...users];

    // Search
    if (searchQuery.trim() !== '') {
      const query = searchQuery.toLowerCase().trim();
      filtered = filtered.filter((user) =>
        user.displayName.toLowerCase().includes(query)
      );
    }

    // Filters
    if (authStatusFilter !== 'all') {
      filtered = filtered.filter((user) => user.authStatus === authStatusFilter);
    }
    if (roleFilter !== 'all') {
      filtered = filtered.filter((user) => user.role === roleFilter);
    }

    // Sort
    filtered.sort((a, b) => {
      let comparison = 0;
      switch (sortBy) {
        case 'name':
          comparison = a.displayName.localeCompare(b.displayName);
          break;
        case 'createdAt':
          comparison =
            new Date(a.createdAt).getTime() - new Date(b.createdAt).getTime();
          break;
        case 'lastAccessAt':
          const aTime = a.lastAccessAt
            ? new Date(a.lastAccessAt).getTime()
            : 0;
          const bTime = b.lastAccessAt
            ? new Date(b.lastAccessAt).getTime()
            : 0;
          comparison = aTime - bTime;
          break;
      }
      return sortOrder === 'desc' ? -comparison : comparison;
    });

    return filtered;
  }, [users, searchQuery, authStatusFilter, roleFilter, sortBy, sortOrder]);
};
