({
  access: 'public', // This endpoint is public but validates refresh token
  method: async () => {
    try {
      // Get refresh token from cookies
      const cookies = context.client.getCookies();
      const refreshRaw = cookies['refresh-token'];

      if (!refreshRaw) {
        return {
          status: 'rejected',
          response: 'Refresh token not found',
        };
      }

      // Get refresh token data from Redis
      const refreshData = await context.client.getRefreshByRaw(refreshRaw);
      console.log('refreshRaw', refreshRaw, refreshData);
      if (!refreshData) {
        return {
          status: 'rejected',
          response: 'Invalid or expired refresh token',
        };
      }

      const { data: refreshInfo, refreshHash } = refreshData;
      console.log('refreshInfo', refreshInfo);
      const userId = refreshInfo.userId;

      // Get user data
      const user = await lib.provider.getUserById(userId);
      if (!user || !user.is_active) {
        return {
          status: 'rejected',
          response: 'User not found or inactive',
        };
      }

      // Get user roles and permissions
      const roles = await lib.provider.getUserRoles(user.id);
      const permissions = await lib.provider.getUserPermissions(user.id);

      // Generate new tokens
      const { characters, secret, length } = config.sessions;
      const {
        accessToken,
        refreshRaw: newRefreshRaw,
        refreshHash: newRefreshHash,
      } = common.makeTokens(secret);

      // Create new session data
      const sessionData = {
        id: user.id,
        email: user.email,
        username: user.username,
        first_name: user.first_name,
        last_name: user.last_name,
        display_name: user.display_name,
        department: user.department,
        position: user.position,
        avatar_url: user.avatar_url,
        is_active: user.is_active,
        roles: roles.map((r) => ({
          id: r.id,
          name: r.name,
          display_name: r.display_name,
          description: r.description,
        })),
        permissions: permissions.map((p) => `${p.resource}.${p.action}`),
        sessionId: context.uuid,
      };

      // Start new session
      await context.client.startSession(
        accessToken,
        newRefreshHash,
        newRefreshRaw,
        sessionData,
      );

      // Invalidate old refresh token (rotation)
      await context.client.invalidateRefreshByRaw(refreshRaw);

      console.log(`Tokens refreshed for user: ${user.email} (ID: ${user.id})`);

      return {
        status: 'refreshed',
        response: {
          ...sessionData,
        },
      };
    } catch (error) {
      console.error('Refresh error:', error);
      return {
        status: 'rejected',
        response: 'Server error occurred during refresh',
      };
    }
  },
});
