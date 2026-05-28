// ─── CharacterPortrait → NeonAvatar redirect ──────────────────────────────────
// All character portrait display now uses NeonAvatar (pure SVG neon symbols).
// This shim keeps any leftover imports working without changes.

import NeonAvatar from '@/components/NeonAvatar';
import { type Character } from '@/constants/characters';
import React from 'react';

interface Props {
  character: Character;
  size?: number;
  isEquipped?: boolean;
  isLocked?: boolean;
  style?: object;
  customPhotoUri?: string;
}

export default function CharacterPortrait({
  character,
  size = 64,
  isEquipped = false,
  isLocked = false,
  style,
}: Props) {
  const avatarId = ((character.id - 1) % 30) + 1;
  return (
    <NeonAvatar
      avatarId={avatarId}
      size={size}
      isEquipped={isEquipped}
      isLocked={isLocked}
      style={style}
    />
  );
}
