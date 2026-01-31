/**
 * Firebase Cloud Functions Entry Point
 *
 * This file exports all Cloud Functions for the Egg Production Management App.
 */

import * as admin from "firebase-admin";

// Initialize Firebase Admin SDK
admin.initializeApp();

// Export auth functions
export {
  generateInvitation,
  validateInvitation,
  acceptInvitation,
  regenerateInvitation,
  revokeUser,
} from "./auth";
