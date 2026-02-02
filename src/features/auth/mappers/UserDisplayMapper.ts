import { AuthStatus, UserRole, User } from '@/shared/types/entities';

export class UserDisplayMapper {
  static getStatusLabel(status: AuthStatus): string {
    switch (status) {
      case AuthStatus.Pending:
        return 'Pendiente';
      case AuthStatus.Authenticated:
        return 'Autenticado';
      case AuthStatus.Revoked:
        return 'Revocado';
      default:
        return status;
    }
  }

  static getRoleLabel(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return 'Administrador';
      case UserRole.User:
        return 'Usuario';
      default:
        return role;
    }
  }

  static getStatusColor(status: AuthStatus): string {
    switch (status) {
      case AuthStatus.Pending:
        return '#FFB300'; // Amber
      case AuthStatus.Authenticated:
        return '#66BB6A'; // Success green
      case AuthStatus.Revoked:
        return '#DC2626'; // Error red
      default:
        return '#9E9E9E'; // Gray
    }
  }

  static getRoleColor(role: UserRole): string {
    switch (role) {
      case UserRole.Admin:
        return '#0097A7'; // Purple
      case UserRole.User:
        return '#8E24AA'; // Cyan
      default:
        return '#9E9E9E'; // Gray
    }
  }

  static getUserDisplayInfo(user: User) {
    return {
      statusLabel: this.getStatusLabel(user.authStatus),
      statusColor: this.getStatusColor(user.authStatus),
      roleLabel: this.getRoleLabel(user.role),
      roleColor: this.getRoleColor(user.role),
    };
  }
}
