({
  access: 'public', // Make logout idempotent: clear if present, succeed regardless
  method: async () => {
    try {
      const cookies = context.client.getCookies();
      const accessToken =
        cookies['auth-token'] || context.client.session?.token;
      const refreshRaw = cookies['refresh-token'];

      // Try to detect userId for full logout
      let userId = context.client.session?.state?.id;
      if (!userId && accessToken) {
        try {
          const s = await context.client.validateAccessToken(accessToken);
          if (s?.id) userId = s.id;
        } catch {}
      }
      if (!userId && refreshRaw) {
        try {
          const r = await context.client.getRefreshByRaw(refreshRaw);
          if (r?.data?.userId) userId = r.data.userId;
        } catch {}
      }

      if (userId) {
        // Global logout: invalidate all sessions for this user
        try {
          await context.client.invalidateAllUserSessions(userId);
          try {
            console.security('logout-all', { userId, ip: context.client.ip });
          } catch {}
        } catch {}
      } else {
        // Fallback: invalidate what we know
        if (accessToken) {
          try {
            await context.client.invalidateAccessSession(accessToken);
          } catch {}
        }
        if (refreshRaw) {
          try {
            await context.client.invalidateRefreshByRaw(refreshRaw);
          } catch {}
        }
        try {
          console.security('logout-partial', { ip: context.client.ip });
        } catch {}
      }

      // Always clear cookies (handles cases when tokens were already missing)
      try {
        context.client.clearSessionCookies();
      } catch {}
      return { status: 'logged_out', response: 'Successfully logged out' };
    } catch (error) {
      console.error('Logout error:', error);
      return {
        status: 'error',
        response: 'Server error occurred during logout',
      };
    }
  },
});
