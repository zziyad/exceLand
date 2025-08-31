({
  access: 'public',
  method: async ({ email, password }) => {
    // Rate limit: per IP and per account (email)
    try {
      const ip = context.client.ip;
      const acct = String(email || '').toLowerCase().trim();
      const ipRes = await context.client.checkSlidingLimit('signin', 'ip', ip, 60, 10);
      if (!ipRes.allowed) {
        try { require('../../lib/logger.js').security('login-rate-limited', { ip, acct }); } catch {}
        const err = new Error('Too many requests');
        err.code = 'RATE_LIMITED';
        err.httpCode = 429;
        err.retryAfterSec = ipRes.retryAfterSec;
        return err;
      }
      if (acct) {
        const acctRes = await context.client.checkSlidingLimit('signin', 'acct', acct, 60, 5);
        if (!acctRes.allowed) {
          try { require('../../lib/logger.js').security('login-rate-limited', { ip, acct }); } catch {}
          const err = new Error('Too many requests');
          err.code = 'RATE_LIMITED';
          err.httpCode = 429;
          err.retryAfterSec = acctRes.retryAfterSec;
          return err;
        }
      }
    } catch {}
    const { characters, secret, length } = config.sessions;
    const { accessToken, refreshRaw, refreshHash } = common.makeTokens(secret);
    // console.log({ accessToken, refreshRaw, refreshHash });

    if (!email || !password)
      return {
        status: 'rejected',
        response: 'Email and password are required',
      };

    try {
      // Get user by email
      const user = await lib.provider.getUser(email);
      if (!user) {
        try { require('../../lib/logger.js').security('login-failed', { email, ip: context.client.ip }); } catch {}
        return { status: 'rejected', response: 'Invalid email or password' };
      }

      // Check if user is active
      if (!user.is_active) {
        try { require('../../lib/logger.js').security('login-failed', { email, ip: context.client.ip, reason: 'inactive' }); } catch {}
        return {
          status: 'rejected',
          response: 'Account is deactivated. Please contact administrator.',
        };
      }

      // Verify password
      const ok = await metarhia.metautil.validatePassword(
        password,
        user.password_hash,
      );
      if (!ok) {
        try { require('../../lib/logger.js').security('login-failed', { email, ip: context.client.ip }); } catch {}
        return {
          status: 'rejected',
          response: 'Invalid email or password',
        };
      }

      // Get user roles and permissions
      const roles = await lib.provider.getUserRoles(user.id);
      const permissions = await lib.provider.getUserPermissions(user.id);

      // Update last login time
      try {
        await db.pg.update(
          'User',
          { last_login_at: new Date().toISOString() },
          { id: user.id },
        );
      } catch (updateError) {
        console.warn('Could not update last_login_at:', updateError);
        // Don't fail login if this update fails
      }

      // Create session data with enhanced user information
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

      // Start session using the session manager
      const started = await context.client.startSession(
        accessToken,
        refreshHash,
        refreshRaw,
        sessionData,
        { createdBy: 'login' },
      );
      if (!started) {
        try { require('../../lib/logger.js').security('login-failed', { email, ip: context.client.ip, reason: 'session-start' }); } catch {}
        return {
          status: 'rejected',
          response: 'Failed to create session',
        };
      }

      try { require('../../lib/logger.js').security('login-success', { email, userId: user.id, ip: context.client.ip }); } catch {}

      return {
        status: 'logged',
        response: {
          ...sessionData,
          // token: token,
        },
      };
    } catch (error) {
      console.error('Signin error:', error);
      return {
        status: 'rejected',
        response: 'Server error occurred during login',
      };
    }
  },
});
