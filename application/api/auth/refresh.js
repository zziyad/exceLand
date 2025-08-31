({
  access: 'public', // This endpoint is public but validates refresh token
  method: async () => {
    try {
      // Rate limit: per IP and per user (after refreshData)
      try {
        const ip = context.client.ip;
        const ipRes = await context.client.checkSlidingLimit('refresh', 'ip', ip, 300, 30);
        if (!ipRes.allowed) return { status: 'rejected', response: 'Too many requests' };
      } catch {}
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
      // Do not log raw tokens
      if (!refreshData) {
        return {
          status: 'rejected',
          response: 'Invalid or expired refresh token',
        };
      }

      const { data: refreshInfo, refreshHash } = refreshData;
      // Now we can rate limit by userId too
      try {
        const userId = refreshInfo.userId;
        const uRes = await context.client.checkSlidingLimit('refresh', 'user', String(userId), 300, 15);
        if (!uRes.allowed) return { status: 'rejected', response: 'Too many requests' };
      } catch {}
      // Do not log refresh meta in production
      const userId = refreshInfo.userId;

      // Bind & detect reuse: compare UA/IP
      const { hashTokenHex } = common;
      const meta = refreshInfo.meta || {};
      const currentUa = context.client.getUserAgent?.() || '';
      const currentUaHash = hashTokenHex(currentUa);
      const currentIp = context.client.ip;
      if (meta.uaHash && meta.uaHash !== currentUaHash) {
        try { await context.sessionManager.invalidateAllUserSessions(userId); } catch {}
        try { context.client.clearSessionCookies(); } catch {}
        return { status: 'rejected', response: 'Refresh reuse detected' };
      }
      // allow subnet match to reduce false positives behind NAT
      const { sameSubnet } = common;
      const maskBits = Number(context.config?.security?.ipSubnetMaskBits || 24);
      if (meta.ip && !sameSubnet(meta.ip, currentIp, maskBits)) {
        try { await context.sessionManager.invalidateAllUserSessions(userId); } catch {}
        try { context.client.clearSessionCookies(); } catch {}
        return { status: 'rejected', response: 'Refresh reuse detected' };
      }

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

      // Revoke old access if present to reduce attack window
      const oldAccess = cookies['auth-token'];
      if (oldAccess) {
        try { await context.client.invalidateAccessSession(oldAccess); } catch {}
      }

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

      // Start new session (meta will be captured inside startSession)
      await context.client.startSession(
        accessToken,
        newRefreshHash,
        newRefreshRaw,
        sessionData,
        { createdBy: 'refresh' },
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
