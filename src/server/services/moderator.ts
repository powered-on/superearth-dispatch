import { context, reddit } from '@devvit/web/server';

export async function isCurrentUserModerator(): Promise<boolean> {
  const subredditName = context.subredditName;
  if (!subredditName) {
    return false;
  }

  const user = await reddit.getCurrentUser();
  if (!user) {
    return false;
  }

  const permissions = await user.getModPermissionsForSubreddit(subredditName);
  return permissions.length > 0;
}
