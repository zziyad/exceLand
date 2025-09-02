({
  generateToken() {
    const { characters, secret, length } = config.sessions;
    return metarhia.metautil.generateToken(secret, characters, length);
  },

  saveSession(token, data) {
    db.pg.update('Session', { data: JSON.stringify(data) }, { token });
  },

  startSession(token, data, fields = {}) {
    const record = { token, data: JSON.stringify(data), ...fields };
    db.pg.insert('Session', record);
  },

  async restoreSession(token) {
    const record = await db.pg.row('Session', ['data'], { token });
    if (record && record.data) return record.data;
    return null;
  },

  deleteSession(token) {
    db.pg.delete('Session', { token });
  },

  // Updated user registration for new User schema
  async registerUser(userData) {
    const {
      username,
      email,
      password_hash,
      first_name,
      last_name,
      display_name,
      department,
      position,
      phone,
      employee_id,
      hire_date,
      is_active,
    } = userData;

    try {
      const result = await db.pg.insert('User', {
        username,
        email,
        password_hash,
        first_name,
        last_name,
        display_name,
        department,
        position,
        phone,
        employee_id,
        hire_date,
        is_active,
        created_at: new Date().toISOString(),
        updated_at: new Date().toISOString(),
      });
      console.log('RESULT', result);
      return result.id; // Return the new user ID
    } catch (error) {
      console.error('Error registering user:', error);
      throw error;
    }
  },

  // Get user by email
  async getUser(email) {
    try {
      return await db.pg.row('User', ['*'], { email });
    } catch (error) {
      console.error('Error getting user by email:', error);
      return null;
    }
  },

  // Get user by username
  async getUserByUsername(username) {
    try {
      return await db.pg.row('User', ['*'], { username });
    } catch (error) {
      console.error('Error getting user by username:', error);
      return null;
    }
  },

  // Get user by ID
  async getUserById(id) {
    try {
      return await db.pg.row('User', ['*'], { id });
    } catch (error) {
      console.error('Error getting user by ID:', error);
      return null;
    }
  },

  // Assign default role to new user
  async assignDefaultRole(userId) {
    try {
      // Get the viewer role ID
      const viewerRole = await db.pg.row('Role', ['id'], { name: 'viewer' });
      if (!viewerRole) {
        throw new Error('Default viewer role not found');
      }

      // Assign the role to the user
      await db.pg.insert('UserRole', {
        user_id: userId,
        role_id: viewerRole.id,
        assigned_by: userId, // Self-assigned for new users
        assigned_at: new Date().toISOString(),
        is_active: true,
      });

      return true;
    } catch (error) {
      console.error('Error assigning default role:', error);
      throw error;
    }
  },

  // Get user roles
  async getUserRoles(userId) {
    try {
      const query = `
        SELECT r.* 
        FROM "Role" r
        JOIN "UserRole" ur ON r.id = ur.role_id
        WHERE ur.user_id = $1 AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
      `;

      const result = await db.pg.query(query, [userId]);
      return result.rows;
    } catch (error) {
      console.error('Error getting user roles:', error);
      return [];
    }
  },

  // Get user permissions (combining role permissions and user-specific permissions)
  async getUserPermissions(userId) {
    try {
      // Get permissions from roles
      const rolePermissionsQuery = `
        SELECT DISTINCT p.resource, p.action, p.description
        FROM "Permission" p
        JOIN "RolePermission" rp ON p.id = rp.permission_id
        JOIN "UserRole" ur ON rp.role_id = ur.role_id
        WHERE ur.user_id = $1 AND ur.is_active = true
        AND (ur.expires_at IS NULL OR ur.expires_at > now())
      `;

      const rolePermissions = await db.pg.query(rolePermissionsQuery, [userId]);

      // Get user-specific permissions (overrides)
      const userPermissionsQuery = `
        SELECT p.resource, p.action, p.description, up.is_granted
        FROM "Permission" p
        JOIN "UserPermission" up ON p.id = up.permission_id
        WHERE up.user_id = $1
        AND (up.expires_at IS NULL OR up.expires_at > now())
      `;

      const userPermissions = await db.pg.query(userPermissionsQuery, [userId]);

      // Combine permissions, with user-specific permissions overriding role permissions
      const permissionMap = new Map();

      // Add role permissions
      rolePermissions.rows.forEach((p) => {
        permissionMap.set(`${p.resource}.${p.action}`, {
          resource: p.resource,
          action: p.action,
          description: p.description,
          source: 'role',
        });
      });

      // Override with user-specific permissions
      userPermissions.rows.forEach((p) => {
        const key = `${p.resource}.${p.action}`;
        if (p.is_granted) {
          permissionMap.set(key, {
            resource: p.resource,
            action: p.action,
            description: p.description,
            source: 'user',
          });
        } else {
          // Remove permission if explicitly denied
          permissionMap.delete(key);
        }
      });

      return Array.from(permissionMap.values());
    } catch (error) {
      console.error('Error getting user permissions:', error);
      return [];
    }
  },

  // Check if user has specific permission
  async hasPermission(userId, resource, action) {
    try {
      const permissions = await this.getUserPermissions(userId);
      return permissions.some(
        (p) => p.resource === resource && p.action === action,
      );
    } catch (error) {
      console.error('Error checking permission:', error);
      return false;
    }
  },

  // Check if user has specific role
  async hasRole(userId, roleName) {
    try {
      const roles = await this.getUserRoles(userId);
      return roles.some((r) => r.name === roleName && r.is_active);
    } catch (error) {
      console.error('Error checking role:', error);
      return false;
    }
  },

  // Assign role to user
  async assignRoleToUser(userId, roleName, assignedBy) {
    try {
      // Get the role ID
      const role = await db.pg.row('Role', ['id'], { name: roleName });
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Check if user already has this role
      const existingRole = await db.pg.row('UserRole', ['id'], {
        user_id: userId,
        role_id: role.id,
      });

      if (existingRole) {
        // Update existing role assignment
        await db.pg.update(
          'UserRole',
          {
            is_active: true,
            assigned_by: assignedBy,
            assigned_at: new Date().toISOString(),
          },
          { user_id: userId, role_id: role.id },
        );
      } else {
        // Create new role assignment
        await db.pg.insert('UserRole', {
          user_id: userId,
          role_id: role.id,
          assigned_by: assignedBy,
          assigned_at: new Date().toISOString(),
          is_active: true,
        });
      }

      return true;
    } catch (error) {
      console.error('Error assigning role to user:', error);
      throw error;
    }
  },

  // Remove role from user
  async removeRoleFromUser(userId, roleName) {
    try {
      // Get the role ID
      const role = await db.pg.row('Role', ['id'], { name: roleName });
      if (!role) {
        throw new Error(`Role '${roleName}' not found`);
      }

      // Deactivate the role assignment
      await db.pg.update(
        'UserRole',
        { is_active: false },
        { user_id: userId, role_id: role.id },
      );

      return true;
    } catch (error) {
      console.error('Error removing role from user:', error);
      throw error;
    }
  },
});
