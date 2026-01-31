/**
 * Validate Invitation Cloud Function (T042)
 *
 * Public function to validate an invitation token.
 * Checks token validity, expiry, and user status.
 *
 * Returns invitation and user data if valid.
 */

import * as functions from "firebase-functions/v2";
import {validateInvitationToken} from "./helpers/validation";

interface ValidateInvitationRequest {
  token: string;
}

interface ValidateInvitationResponse {
  valid: boolean;
  invitation?: any;
  user?: any;
  error?: string;
}

export const validateInvitation = functions.https.onCall<
  ValidateInvitationRequest,
  Promise<ValidateInvitationResponse>
>(async (request) => {
  const {data} = request;

  try {
    const {token} = data;

    if (!token) {
      throw new functions.https.HttpsError(
        "invalid-argument",
        "Token es requerido"
      );
    }

    // Use shared validation helper
    const {invitationDoc, invitation, userDoc, user} =
      await validateInvitationToken(token);

    const expiresAt = invitation.expiresAt.toDate();

    // Return valid invitation
    return {
      valid: true,
      invitation: {
        id: invitationDoc.id,
        userId: invitation.userId,
        expiresAt: expiresAt.toISOString(),
        status: invitation.status,
      },
      user: {
        id: userDoc.id,
        displayName: user.displayName,
        role: user.role,
      },
    };
  } catch (error: any) {
    // Return error as response instead of throwing (for UX)
    if (error instanceof functions.https.HttpsError) {
      return {
        valid: false,
        error: error.message,
      };
    }

    console.error("Error validating invitation:", error);
    return {
      valid: false,
      error: "Error al validar la invitación",
    };
  }
});
