({
  access: 'admin',
  method: async ({
    id,
    profile_picture = '',
    username = '',
    password = '',
  }) => {
    const target = {};

    // Validation checks
    if (password !== '') {
      if (password.length < 6)
        return {
          status: 'rejected',
          response: 'Password must be at least 6 characters',
        };
      const hash = await metarhia.metautil.hashPassword(password);
      target['password'] = hash;
    }

    if (username !== '') {
      if (username.length < 4 || username.length > 20)
        return {
          status: 'rejected',
          response: 'Username must be between 3 and 20 characters',
        };

      if (username.includes(' '))
        return {
          status: 'rejected',
          response: 'Username cannot contain spaces',
        };
      if (username !== username.toLowerCase())
        return { status: 'Username must be lowercase' };

      if (!username.match(/^[a-zA-Z0-9]+$/))
        return {
          status: 'rejected',
          response: 'Username can only contain letters and numbers',
        };

      target['username'] = username;
    }

    console.log({ profile_picture });
    if (profile_picture !== '') target['profile_picture'] = profile_picture;

    console.log({ target });

    if (JSON.stringify(target) === '{}') {
      return { status: 'rejected', response: 'No fild is update' };
    }

    const user = await db.pg.row('users', { id });
    const {
      id: userId,
      created_at,
      updated_at,
      is_admin,
      ...restOfUser
    } = user;
    await db.pg.update('users', target, restOfUser);

    return { status: 'updated', response: target };
  },
});
