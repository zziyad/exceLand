({
  access: 'public',
  method: async ({ email, password }) => {
    const { characters, secret, length } = config.sessions;
    const { accessToken, refreshRaw, refreshHash } = common.makeTokens(secret);
    console.log({ accessToken, refreshRaw, refreshHash });

    if (!email || !password)
      return {
        status: 'rejected',
        response: 'Email and password are required',
      };

    try {
      // Get user by email
      const user = await lib.provider.getUser(email);
      if (!user)
        return { status: 'rejected', response: 'Invalid email or password' };

      // Check if user is active
      if (!user.is_active)
        return {
          status: 'rejected',
          response: 'Account is deactivated. Please contact administrator.',
        };

      // Verify password
      const ok = await metarhia.metautil.validatePassword(
        password,
        user.password_hash,
      );
      if (!ok)
        return {
          status: 'rejected',
          response: 'Invalid email or password',
        };

      // Get user roles and permissions
      const roles = await lib.provider.getUserRoles(user.id);
      const permissions = await lib.provider.getUserPermissions(user.id);

      // Generate token
      // const token = metarhia.metautil.generateToken(secret, characters, length);

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
      await context.client.startSession(
        accessToken,
        refreshHash,
        refreshRaw,
        sessionData,
      );

      console.log(`User logged in successfully: ${email} (ID: ${user.id})`);

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
