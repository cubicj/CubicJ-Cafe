export function isAdmin(discordId: string): boolean {
  const adminIds = (process.env.ADMIN_DISCORD_IDS || process.env.NEXT_PUBLIC_ADMIN_DISCORD_IDS || '')
    .split(',').map(id => id.trim()).filter(Boolean);
  return adminIds.includes(discordId);
}

export function getAdminIds(): string[] {
  return process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
}

