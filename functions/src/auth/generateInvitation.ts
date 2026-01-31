/**
 * Generate Invitation Cloud Function (T041)
 *
 * Admin-only function to generate a new invitation for a user.
 * Creates an invitation token (deep link generated in frontend).
 *
 * NO USES Firebase Authentication - validates using Firestore only.
 * Prevents invitations for revoked users.
 */

import * as functions from "firebase-functions/v2/https";
import * as admin from "firebase-admin";
import {checkUserNotRevoked, createInvitationData} from "./helpers";

interface GenerateInvitationRequest {
  targetUserId: string;
  adminUserId: string;
  adminDeviceId: string;
}

interface GenerateInvitationResponse {
  success: boolean;
  invitationId?: string;
  token?: string;
  expiresAt?: string;
  error?: string;
}

export const generateInvitation = functions.onRequest(
  async (req, res) => {
    // Set CORS headers
    res.set("Access-Control-Allow-Origin", "*");
    res.set("Access-Control-Allow-Methods", "POST");
    res.set("Access-Control-Allow-Headers", "Content-Type");

    if (req.method === "OPTIONS") {
      res.status(204).send("");
      return;
    }

    if (req.method !== "POST") {
      res.status(405).json({
        success: false,
        error: "Method not allowed",
      });
      return;
    }

    try {
      const {targetUserId, adminUserId, adminDeviceId} =
        req.body as GenerateInvitationRequest;

      // Validate request body
      if (!targetUserId || !adminUserId || !adminDeviceId) {
        res.status(400).json({
          success: false,
          error: "targetUserId, adminUserId, and adminDeviceId son requeridos",
        });
        return;
      }

      // Verify admin user exists and has admin role
      const adminDoc = await admin
        .firestore()
        .collection("users")
        .doc(adminUserId)
        .get();

      if (!adminDoc.exists) {
        res.status(404).json({
          success: false,
          error: "Usuario administrador no encontrado",
        });
        return;
      }

      const adminUser = adminDoc.data();

      // Verify user is admin
      if (adminUser?.role !== "admin") {
        res.status(403).json({
          success: false,
          error: "Acceso denegado. Se requiere rol de administrador",
        });
        return;
      }

      // Verify admin is not revoked
      if (adminUser?.authStatus === "revoked") {
        res.status(403).json({
          success: false,
          error: "Acceso denegado. Usuario revocado",
        });
        return;
      }

      // Verify device is authorized
      const authorizedDevices = adminUser?.authorizedDevices || [];
      const deviceAuthorized = authorizedDevices.some(
        (device: any) => device.deviceId === adminDeviceId
      );

      if (!deviceAuthorized) {
        res.status(403).json({
          success: false,
          error: "Dispositivo no autorizado",
        });
        return;
      }

      // Check if target user exists
      const userDoc = await admin
        .firestore()
        .collection("users")
        .doc(targetUserId)
        .get();

      if (!userDoc.exists) {
        res.status(404).json({
          success: false,
          error: "Usuario objetivo no encontrado",
        });
        return;
      }

      const targetUser = userDoc.data();

      // Prevent invitations for revoked users
      checkUserNotRevoked(targetUser, "generar invitación");

      // Create invitation data using helper
      const {invitationId, token, expiresAt, invitation} =
        createInvitationData(targetUserId, adminUserId);

      // Save invitation
      await admin
        .firestore()
        .collection("invitations")
        .doc(invitationId)
        .set(invitation);

      // Update user's invitationId
      await admin
        .firestore()
        .collection("users")
        .doc(targetUserId)
        .update({
          invitationId,
          updatedAt: admin.firestore.FieldValue.serverTimestamp(),
        });

      // Return token only - deep link will be generated in frontend
      // using InvitationFactory.generateDeepLink(token) from app.json scheme
      const response: GenerateInvitationResponse = {
        success: true,
        invitationId,
        token,
        expiresAt: expiresAt.toISOString(),
      };

      res.status(200).json(response);
    } catch (error: any) {
      console.error("Error generating invitation:", error);

      // Handle checkUserNotRevoked errors
      if (error.message?.includes("revocado")) {
        res.status(403).json({
          success: false,
          error: error.message,
        });
        return;
      }

      res.status(500).json({
        success: false,
        error: "Error al generar la invitación",
      });
    }
  }
);
