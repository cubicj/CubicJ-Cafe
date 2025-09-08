export function isAdmin(discordId: string): boolean {
  const adminIds = process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
  return adminIds.includes(discordId);
}

export function getAdminIds(): string[] {
  return process.env.ADMIN_DISCORD_IDS?.split(',').map(id => id.trim()) || [];
}

