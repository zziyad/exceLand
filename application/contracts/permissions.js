/**
 * Centralized Permission Contract
 * Defines all available permissions in the system
 * This is the single source of truth for permissions
 */

const PERMISSIONS = {
  // Event permissions
  EVENT: {
    CREATE: 'event.create',
    READ: 'event.read',
    UPDATE: 'event.update',
    DELETE: 'event.delete',
  },

  // Flight Schedule permissions
  FLIGHT_SCHEDULE: {
    CREATE: 'flight_schedule.create',
    READ: 'flight_schedule.read',
    UPDATE: 'flight_schedule.update',
    DELETE: 'flight_schedule.delete',
    UPLOAD: 'flight_schedule.upload',
  },

  // Task permissions
  TASK: {
    CREATE: 'task.create',
    READ: 'task.read',
    UPDATE: 'task.update',
    DELETE: 'task.delete',
  },

  // User management permissions
  USER: {
    CREATE: 'user.create',
    READ: 'user.read',
    UPDATE: 'user.update',
    DELETE: 'user.delete',
    ASSIGN_ROLES: 'user.assign_roles',
  },

  // System permissions
  SYSTEM: {
    ADMIN: 'system.admin',
    CONFIG: 'system.config',
    LOGS: 'system.logs',
  },
};

/**
 * Get all permissions for a specific resource
 * @param {string} resource - The resource name (e.g., 'event', 'user')
 * @returns {string[]} Array of permissions for the resource
 */
function getResourcePermissions(resource) {
  const resourceKey = resource.toUpperCase();
  const resourcePermissions = PERMISSIONS[resourceKey];

  if (!resourcePermissions) {
    throw new Error(`Unknown resource: ${resource}`);
  }

  return Object.values(resourcePermissions);
}

/**
 * Get all available permissions
 * @returns {string[]} Array of all permissions
 */
function getAllPermissions() {
  return Object.values(PERMISSIONS).flatMap((resourcePermissions) =>
    Object.values(resourcePermissions),
  );
}

/**
 * Check if a permission exists
 * @param {string} permission - The permission to check
 * @returns {boolean} True if permission exists
 */
function isValidPermission(permission) {
  return getAllPermissions().includes(permission);
}

/**
 * Get permission by resource and action
 * @param {string} resource - The resource name
 * @param {string} action - The action (create, read, update, delete)
 * @returns {string} The permission string
 */
function getPermission(resource, action) {
  const resourceKey = resource.toUpperCase();
  const actionKey = action.toUpperCase();

  if (!PERMISSIONS[resourceKey]) {
    throw new Error(`Unknown resource: ${resource}`);
  }

  if (!PERMISSIONS[resourceKey][actionKey]) {
    throw new Error(`Unknown action: ${action} for resource: ${resource}`);
  }

  return PERMISSIONS[resourceKey][actionKey];
}

/**
 * Role-based permission mapping
 * Defines which permissions each role has
 */
const ROLE_PERMISSIONS = {
  super_admin: getAllPermissions(), // Super admin has all permissions

  admin: [
    // Event permissions
    ...getResourcePermissions('event'),
    // Flight schedule permissions
    ...getResourcePermissions('flight_schedule'),
    // Task permissions
    ...getResourcePermissions('task'),
    // User read permission only
    PERMISSIONS.USER.READ,
  ],

  manager: [
    // Event permissions
    ...getResourcePermissions('event'),
    // Flight schedule permissions
    ...getResourcePermissions('flight_schedule'),
    // Task permissions
    ...getResourcePermissions('task'),
  ],

  user: [
    // Read-only permissions
    PERMISSIONS.EVENT.READ,
    PERMISSIONS.FLIGHT_SCHEDULE.READ,
    PERMISSIONS.TASK.READ,
  ],
};

/**
 * Get permissions for a role
 * @param {string} roleName - The role name
 * @returns {string[]} Array of permissions for the role
 */
function getRolePermissions(roleName) {
  return ROLE_PERMISSIONS[roleName] || [];
}

/**
 * Check if a role has a specific permission
 * @param {string} roleName - The role name
 * @param {string} permission - The permission to check
 * @returns {boolean} True if role has permission
 */
function roleHasPermission(roleName, permission) {
  const rolePermissions = getRolePermissions(roleName);
  return rolePermissions.includes(permission);
}

module.exports = {
  PERMISSIONS,
  getResourcePermissions,
  getAllPermissions,
  isValidPermission,
  getPermission,
  ROLE_PERMISSIONS,
  getRolePermissions,
  roleHasPermission,
};
