export class InvitationApiService {
  constructor(private baseUrl: string) {}

  async generateInvitation(
    targetUserId: string,
    adminUserId: string,
    adminDeviceId: string
  ): Promise<{
    success: boolean;
    token?: string;
    expiresAt?: string;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/generateInvitation`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          targetUserId,
          adminUserId,
          adminDeviceId,
        }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error generating invitation:', error);
      return {
        success: false,
        error: 'No se pudo generar la invitación. Verifica tu conexión.',
      };
    }
  }

  async revokeUser(userId: string): Promise<{
    success: boolean;
    error?: string;
  }> {
    try {
      const response = await fetch(`${this.baseUrl}/revokeUser`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ userId }),
      });
      return await response.json();
    } catch (error) {
      console.error('Error revoking user:', error);
      return {
        success: false,
        error: 'No se pudo revocar el acceso. Verifica tu conexión.',
      };
    }
  }
}
