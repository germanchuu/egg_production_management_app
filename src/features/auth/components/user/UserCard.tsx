/**
 * User Card Component
 *
 * Displays user information with actions via a bottom sheet menu.
 */

import React, { useState } from 'react';
import { View, Text, Pressable, Modal } from 'react-native';
import { MotiView } from 'moti';
import {
  UserX,
  Shield,
  MoreVertical,
  Mail,
  Pencil,
  User as UserIcon,
} from 'lucide-react-native';
import { ConfirmDialog } from '@/shared/components';
import { theme } from '@/core/theme';
import type { User } from '@/shared/types/entities';
import { AuthStatus, UserRole } from '@/shared/types/entities';
import { UserDisplayMapper } from '../../mappers/UserDisplayMapper';

// ─── Style helpers ────────────────────────────────────────────────────────────

function statusBadgeStyle(status: AuthStatus): { bg: string; text: string } {
  switch (status) {
    case AuthStatus.Authenticated:
      return { bg: 'bg-success/10', text: 'text-success' };
    case AuthStatus.Revoked:
      return { bg: 'bg-error/10', text: 'text-error' };
    default:
      return { bg: 'bg-amber-100', text: 'text-amber-700' };
  }
}

// ─── Props ────────────────────────────────────────────────────────────────────

interface UserCardProps {
  user: User;
  animationDelay: number;
  onGenerateInvitation: (user: User) => void;
  onRevokeUser: (user: User) => void;
  onEdit: (user: User) => void;
}

// ─── Component ───────────────────────────────────────────────────────────────

export const UserCard: React.FC<UserCardProps> = ({
  user,
  animationDelay,
  onGenerateInvitation,
  onRevokeUser,
  onEdit,
}) => {
  // Two states: modalVisible keeps the Modal mounted during close animation;
  // menuOpen drives the Moti animations (backdrop fade + sheet slide).
  const [modalVisible, setModalVisible]   = useState(false);
  const [menuOpen, setMenuOpen]           = useState(false);
  const [showRevokeDialog, setShowRevokeDialog] = useState(false);

  const { statusLabel, roleLabel } = UserDisplayMapper.getUserDisplayInfo(user);
  const statusStyle = statusBadgeStyle(user.authStatus);

  const canEdit               = user.authStatus !== AuthStatus.Revoked;
  const canGenerateInvitation = user.authStatus === AuthStatus.Pending && user.role !== UserRole.Admin;
  const canRevoke             = user.authStatus !== AuthStatus.Revoked && user.role !== UserRole.Admin;
  const hasActions            = canEdit || canGenerateInvitation || canRevoke;

  const openMenu = () => {
    setModalVisible(true);
    setMenuOpen(true);
  };

  // Animate out first, then unmount the Modal after the transition completes.
  const closeMenu = () => {
    setMenuOpen(false);
    setTimeout(() => setModalVisible(false), 300);
  };

  const initials = user.displayName
    .split(' ')
    .map((n) => n.charAt(0))
    .slice(0, 2)
    .join('')
    .toUpperCase();

  const createdStr = new Date(user.createdAt).toLocaleDateString('es-ES', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  });

  const lastAccessStr = user.lastAccessAt
    ? new Date(user.lastAccessAt).toLocaleDateString('es-ES', {
        day: '2-digit',
        month: 'short',
      })
    : null;

  return (
    <MotiView
      from={{ opacity: 0, translateY: 20 }}
      animate={{ opacity: 1, translateY: 0 }}
      transition={{ type: 'timing', duration: 300, delay: animationDelay }}
    >
      <View className="bg-white rounded-md border border-gray-200 shadow-sm mb-sm overflow-hidden">

        {/* Header */}
        <View className="flex-row items-start gap-md px-md pt-sm pb-md bg-gray-100">
          <View className="w-9 h-9 rounded-full bg-white border border-gray-200 items-center justify-center mt-0.5">
            <Text className="text-xs font-bold text-primary-700">{initials}</Text>
          </View>

          <View className="flex-1">
            {/* Name + status badge */}
            <View className="flex-row items-center gap-xs">
              <Text
                className="text-sm font-semibold text-textPrimary flex-1"
                numberOfLines={1}
              >
                {user.displayName}
              </Text>
              <View className={`px-sm py-0.5 rounded-full ${statusStyle.bg}`}>
                <Text className={`text-xs font-medium ${statusStyle.text}`}>
                  {statusLabel}
                </Text>
              </View>
            </View>

            {/* Role badge — always visible */}
            {user.role === UserRole.Admin ? (
              <View className="flex-row items-center gap-1 mt-xs self-start px-sm py-0.5 rounded-full bg-primary-100">
                <Shield size={10} color={theme.colors.primary['700']} />
                <Text className="text-xs font-medium text-primary-700">
                  {roleLabel}
                </Text>
              </View>
            ) : (
              <View className="flex-row items-center gap-1 mt-xs self-start px-sm py-0.5 rounded-full bg-purple-100">
                <UserIcon size={10} color="#7E22CE" />
                <Text className="text-xs font-medium text-purple-700">
                  {roleLabel}
                </Text>
              </View>
            )}
          </View>

          {hasActions && (
            <Pressable
              onPress={openMenu}
              className="p-sm rounded-md bg-white border border-gray-200 active:bg-gray-50"
            >
              <MoreVertical size={16} color={theme.colors.gray['600']} />
            </Pressable>
          )}
        </View>

        {/* Divider */}
        <View className="h-px bg-gray-100" />

        {/* Stats */}
        <View className="flex-row px-md py-sm gap-md">
          <View className="flex-1">
            <Text className="text-xs text-textTertiary">Creado</Text>
            <Text className="text-xs font-medium text-textSecondary mt-0.5">
              {createdStr}
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-xs text-textTertiary">Dispositivos</Text>
            <Text className="text-xs font-medium text-textSecondary mt-0.5">
              {user.authorizedDevices?.length ?? 0} de 3
            </Text>
          </View>

          <View className="flex-1">
            <Text className="text-xs text-textTertiary">Último acceso</Text>
            <Text className="text-xs font-medium text-textSecondary mt-0.5">
              {lastAccessStr ?? '—'}
            </Text>
          </View>
        </View>
      </View>

      {/* ─── Action Bottom Sheet ─────────────────────────────────────────────── */}
      <Modal visible={modalVisible} transparent animationType="none">

        {/* Backdrop — fades in/out independently */}
        <MotiView
          from={{ opacity: 0 }}
          animate={{ opacity: menuOpen ? 1 : 0 }}
          transition={{ type: 'timing', duration: 220 }}
          className="absolute inset-0 bg-black/40"
        >
          <Pressable className="flex-1" onPress={closeMenu} />
        </MotiView>

        {/* Sheet — slides up/down independently */}
        <MotiView
          from={{ translateY: 500 }}
          animate={{ translateY: menuOpen ? 0 : 500 }}
          transition={{ type: 'timing', duration: 280 }}
          className="absolute bottom-0 left-0 right-0 bg-white rounded-t-2xl overflow-hidden"
        >
          {/* Handle */}
          <View className="items-center pt-sm pb-xs">
            <View className="w-10 h-1 bg-gray-200 rounded-full" />
          </View>

          {/* Sheet header */}
          <View className="px-lg pt-xs pb-md border-b border-gray-100">
            <Text className="text-base font-semibold text-textPrimary">
              {user.displayName}
            </Text>
            <Text className="text-xs text-textTertiary mt-0.5">
              Selecciona una acción
            </Text>
          </View>

          {/* Action items */}
          <View className="px-md py-sm gap-xs">
            {canEdit && (
              <Pressable
                onPress={() => { closeMenu(); onEdit(user); }}
                className="flex-row items-center gap-md p-md rounded-md active:bg-gray-50"
              >
                <View className="w-9 h-9 rounded-full bg-gray-100 items-center justify-center">
                  <Pencil size={16} color={theme.colors.gray['700']} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-textPrimary">
                    Editar usuario
                  </Text>
                  <Text className="text-xs text-textTertiary">
                    Modificar datos del usuario
                  </Text>
                </View>
              </Pressable>
            )}

            {canGenerateInvitation && (
              <Pressable
                onPress={() => { closeMenu(); onGenerateInvitation(user); }}
                className="flex-row items-center gap-md p-md rounded-md active:bg-gray-50"
              >
                <View className="w-9 h-9 rounded-full bg-primary-100 items-center justify-center">
                  <Mail size={16} color={theme.colors.primary['700']} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-textPrimary">
                    Generar invitación
                  </Text>
                  <Text className="text-xs text-textTertiary">
                    Enviar código de acceso al usuario
                  </Text>
                </View>
              </Pressable>
            )}

            {canRevoke && (
              <Pressable
                onPress={() => { closeMenu(); setShowRevokeDialog(true); }}
                className="flex-row items-center gap-md p-md rounded-md active:bg-red-50"
              >
                <View className="w-9 h-9 rounded-full bg-error/10 items-center justify-center">
                  <UserX size={16} color={theme.colors.error.DEFAULT} />
                </View>
                <View className="flex-1">
                  <Text className="text-sm font-medium text-error">
                    Revocar acceso
                  </Text>
                  <Text className="text-xs text-textTertiary">
                    Eliminar los permisos del usuario
                  </Text>
                </View>
              </Pressable>
            )}
          </View>

          <View className="pb-xl" />
        </MotiView>
      </Modal>

      {/* ─── Confirm Revoke ──────────────────────────────────────────────────── */}
      <ConfirmDialog
        visible={showRevokeDialog}
        title="Revocar Acceso"
        message={`¿Estás seguro de que deseas revocar el acceso de ${user.displayName}? Esta acción es permanente y no se puede deshacer.`}
        confirmText="Revocar"
        cancelText="Cancelar"
        variant="danger"
        onConfirm={() => {
          setShowRevokeDialog(false);
          onRevokeUser(user);
        }}
        onCancel={() => setShowRevokeDialog(false)}
      />
    </MotiView>
  );
};
