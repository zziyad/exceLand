({
  access: 'public', // Make logout idempotent: clear if present, succeed regardless
  method: async () => {
    try {
      const accessToken = context.client.getCookies()['auth-token'] || context.client.session?.token;
      if (accessToken) {
        try { await context.client.invalidateAccessSession(accessToken); } catch {}
      }

      const refreshRaw = context.client.getCookies()['refresh-token'];
      if (refreshRaw) {
        try { await context.client.invalidateRefreshByRaw(refreshRaw); } catch {}
      }

      // Always clear cookies (handles cases when tokens were already missing)
      try { context.client.clearSessionCookies(); } catch {}
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
