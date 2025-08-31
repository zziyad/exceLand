({
  access: 'private', // This endpoint requires authentication
  method: async () => {
    try {
      // Get user data from the session (set by middleware)
      const sessionData = context.client.session?.state;
      console.log('sessionData', sessionData);

      if (!sessionData) {
        return {
          status: 'error',
          response: 'No session data found',
        };
      }

      // Return user information (excluding sensitive data)
      const userInfo = {
        id: sessionData.id,
        email: sessionData.email,
        username: sessionData.username,
        first_name: sessionData.first_name,
        last_name: sessionData.last_name,
        display_name: sessionData.display_name,
        department: sessionData.department,
        position: sessionData.position,
        avatar_url: sessionData.avatar_url,
        is_active: sessionData.is_active,
        roles: sessionData.roles,
        permissions: sessionData.permissions,
      };

      return {
        status: 'success',
        response: userInfo,
      };
    } catch (error) {
      console.error('Me endpoint error:', error);
      return {
        status: 'error',
        response: 'Server error occurred',
      };
    }
  },
});
