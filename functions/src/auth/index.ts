/**
 * Authentication Cloud Functions
 *
 * Exports all authentication-related Cloud Functions.
 *
 * All functions refactored to use Result pattern + clean architecture
 */

export { generateInvitation } from './handlers/generateInvitation';
export { regenerateInvitation } from './handlers/regenerateInvitation';
export { validateInvitation } from './handlers/validateInvitation';
export { acceptInvitation } from './handlers/acceptInvitation';
export { revokeUser } from './handlers/revokeUser';
