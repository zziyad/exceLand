-- =============================================================================
-- TRS SYSTEM SCHEMA - Enhanced User Management with Roles & Permissions
-- =============================================================================
-- 
-- This schema replaces the simple Account table with a comprehensive User entity
-- system that includes role-based access control (RBAC) and granular permissions.
--
-- MIGRATION NOTES:
-- - Account table replaced with User table
-- - All foreign key references updated from Account(id) to User(id)
-- - New Role, Permission, UserRole, RolePermission, UserPermission tables added
-- - Default roles and permissions pre-configured
-- - Audit trail for permission changes
--
-- =============================================================================

-- Common trigger function (must be defined before any triggers use it)
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

-- Enhanced User Management System
CREATE TABLE "User" (
	id                          bigserial PRIMARY KEY,
	email                       varchar(255) NOT NULL UNIQUE,
	username                    varchar(64) UNIQUE,
	password_hash               varchar(255) NOT NULL,
	first_name                  varchar(100) NOT NULL,
	last_name                   varchar(100) NOT NULL,
	display_name                varchar(150),
	avatar_url                  varchar(500),
	phone                       varchar(20),
	department                  varchar(100),
	position                    varchar(100),
	employee_id                 varchar(50) UNIQUE,
	hire_date                   date,
	is_active                   boolean NOT NULL DEFAULT true,
	last_login_at               timestamptz,
	last_activity_at            timestamptz,
	password_reset_token        varchar(128),
	password_reset_expires_at   timestamptz,
	created_at                  timestamptz NOT NULL DEFAULT now(),
	updated_at                  timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_user_updated
BEFORE UPDATE ON "User"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_user_active ON "User"(is_active);
CREATE INDEX idx_user_email ON "User"(email);
CREATE INDEX idx_user_username ON "User"(username);
CREATE INDEX idx_user_department ON "User"(department);
CREATE INDEX idx_user_employee_id ON "User"(employee_id);

-- Role Management System
CREATE TABLE "Role" (
	id                    bigserial PRIMARY KEY,
	name                  varchar(100) NOT NULL UNIQUE,
	display_name          varchar(150) NOT NULL,
	description           text,
	is_system            boolean NOT NULL DEFAULT false,
	is_active            boolean NOT NULL DEFAULT true,
	created_at           timestamptz NOT NULL DEFAULT now(),
	updated_at           timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_role_updated
BEFORE UPDATE ON "Role"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_role_active ON "Role"(is_active);
CREATE INDEX idx_role_system ON "Role"(is_system);

-- Permission System
CREATE TABLE "Permission" (
	id                    bigserial PRIMARY KEY,
	resource             varchar(100) NOT NULL,
	action               varchar(100) NOT NULL,
	description          text,
	is_system            boolean NOT NULL DEFAULT false,
	created_at           timestamptz NOT NULL DEFAULT now(),
	UNIQUE (resource, action)
);

CREATE INDEX idx_permission_resource ON "Permission"(resource);
CREATE INDEX idx_permission_action ON "Permission"(action);

-- User-Role Assignment (Many-to-Many)
CREATE TABLE "UserRole" (
	id                    bigserial PRIMARY KEY,
	user_id              bigint NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
	role_id              bigint NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
	assigned_by          bigint NOT NULL REFERENCES "User"(id),
	assigned_at          timestamptz NOT NULL DEFAULT now(),
	expires_at           timestamptz,
	is_active            boolean NOT NULL DEFAULT true,
	
	UNIQUE (user_id, role_id),
	CONSTRAINT chk_role_not_expired CHECK (expires_at IS NULL OR expires_at > now())
);

CREATE INDEX idx_user_role_user_id ON "UserRole"(user_id);
CREATE INDEX idx_user_role_role_id ON "UserRole"(role_id);
CREATE INDEX idx_user_role_active ON "UserRole"(is_active);

-- Role-Permission Assignment
CREATE TABLE "RolePermission" (
	id                    bigserial PRIMARY KEY,
	role_id              bigint NOT NULL REFERENCES "Role"(id) ON DELETE CASCADE,
	permission_id        bigint NOT NULL REFERENCES "Permission"(id) ON DELETE CASCADE,
	granted_by           bigint, -- Made nullable for initial setup
	granted_at           timestamptz NOT NULL DEFAULT now(),
	
	UNIQUE (role_id, permission_id)
);

-- Note: granted_by is nullable initially to allow system setup without existing users
-- After migration, you should add the foreign key constraint and NOT NULL:
-- ALTER TABLE "RolePermission" ADD CONSTRAINT fk_rolepermission_granted_by FOREIGN KEY (granted_by) REFERENCES "User"(id);
-- ALTER TABLE "RolePermission" ALTER COLUMN granted_by SET NOT NULL;

CREATE INDEX idx_role_permission_role_id ON "RolePermission"(role_id);
CREATE INDEX idx_role_permission_permission_id ON "RolePermission"(permission_id);

-- User-Specific Permissions (Override role permissions)
CREATE TABLE "UserPermission" (
	id                    bigserial PRIMARY KEY,
	user_id              bigint NOT NULL REFERENCES "User"(id) ON DELETE CASCADE,
	permission_id        bigint NOT NULL REFERENCES "Permission"(id) ON DELETE CASCADE,
	is_granted           boolean NOT NULL,
	granted_by           bigint NOT NULL REFERENCES "User"(id),
	granted_at           timestamptz NOT NULL DEFAULT now(),
	expires_at           timestamptz,
	reason               text,
	
	UNIQUE (user_id, permission_id)
);

CREATE INDEX idx_user_permission_user_id ON "UserPermission"(user_id);
CREATE INDEX idx_user_permission_permission_id ON "UserPermission"(permission_id);

-- Audit Trail
CREATE TABLE "PermissionAudit" (
	id                    bigserial PRIMARY KEY,
	user_id              bigint NOT NULL REFERENCES "User"(id),
	action               varchar(100) NOT NULL,
	resource             varchar(100),
	resource_id          bigint,
	ip_address           inet,
	user_agent           text,
	metadata             jsonb,
	created_at           timestamptz NOT NULL DEFAULT now()
);

CREATE INDEX idx_permission_audit_user_id ON "PermissionAudit"(user_id);
CREATE INDEX idx_permission_audit_action ON "PermissionAudit"(action);
CREATE INDEX idx_permission_audit_created_at ON "PermissionAudit"(created_at);

-- Core Event
CREATE TABLE "Event" (
	id                bigserial PRIMARY KEY,
	code              varchar(32) UNIQUE,
	name              varchar(255) NOT NULL,
	status            varchar(16) NOT NULL CHECK (status IN ('planning','active','completed','cancelled')),
	timezone          varchar(64) NOT NULL,                -- IANA
	start_at          timestamptz NOT NULL,
	end_at            timestamptz NOT NULL,
	expected_guests   integer NOT NULL CHECK (expected_guests BETWEEN 1 AND 1000000),

	-- Country/city kept on event for quick reference; venues live in separate table
	country_code      char(2),
	city              varchar(128),


	description       text,
	organizer_name    varchar(255),

	-- Event-level caps (as requested)
	max_vapp          integer NOT NULL DEFAULT 0 CHECK (max_vapp BETWEEN 0 AND 10000),
	max_fleet         integer NOT NULL DEFAULT 0 CHECK (max_fleet BETWEEN 0 AND 10000),

	-- Per-event operational defaults
	settings          jsonb NOT NULL DEFAULT jsonb_build_object(),
	created_by        bigint REFERENCES "User"(id),
	created_at        timestamptz NOT NULL DEFAULT now(),
	updated_at        timestamptz NOT NULL DEFAULT now(),
	CONSTRAINT chk_event_dates CHECK (end_at > start_at)
);

CREATE INDEX idx_event_status     ON "Event"(status);
CREATE INDEX idx_event_start_at   ON "Event"(start_at);
CREATE INDEX idx_event_country    ON "Event"(country_code);
CREATE INDEX idx_event_created_by ON "Event"(created_by);

-- updated_at trigger
CREATE OR REPLACE FUNCTION set_updated_at() RETURNS trigger AS $$
BEGIN NEW.updated_at = now(); RETURN NEW; END; $$ LANGUAGE plpgsql;
CREATE TRIGGER trg_event_updated BEFORE UPDATE ON "Event"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Event Venues (single table for venues/destinations)
CREATE TABLE "EventVenue" (
	id           bigserial PRIMARY KEY,
	event_id     bigint NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
	name         varchar(255) NOT NULL,     -- e.g., "Conference Center", "International Airport T1"
	address      varchar(255),
	city         varchar(128),
	latitude     numeric(10,6),
	longitude    numeric(10,6),
	is_primary   boolean NOT NULL DEFAULT false,
	order_idx    integer NOT NULL DEFAULT 0, -- optional ordering in routes/views
	notes        text,

	created_at   timestamptz NOT NULL DEFAULT now(),
	updated_at   timestamptz NOT NULL DEFAULT now(),
	UNIQUE (event_id, name)
);

CREATE TRIGGER trg_event_venue_updated
BEFORE UPDATE ON "EventVenue"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_event_venue_event     ON "EventVenue"(event_id);
CREATE INDEX idx_event_venue_primary   ON "EventVenue"(event_id, is_primary);

-- Event Hotels (separate from venues; can be referenced by schedules, pickups)
CREATE TABLE "EventHotel" (
	id             bigserial PRIMARY KEY,
	event_id       bigint NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
	name           varchar(255) NOT NULL,
	address        varchar(255),
	city           varchar(128),
	latitude       numeric(10,6),
	longitude      numeric(10,6),
	pickup_note    varchar(255),   -- e.g., lobby, gate, side entrance
	is_primary     boolean NOT NULL DEFAULT false,
	order_idx      integer NOT NULL DEFAULT 0,

	created_at     timestamptz NOT NULL DEFAULT now(),
	updated_at     timestamptz NOT NULL DEFAULT now(),
	UNIQUE (event_id, name)
);

CREATE TRIGGER trg_event_hotel_updated
BEFORE UPDATE ON "EventHotel"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

CREATE INDEX idx_event_hotel_event   ON "EventHotel"(event_id);
CREATE INDEX idx_event_hotel_primary ON "EventHotel"(event_id, is_primary);


CREATE TABLE "FlightSchedule" (
	flight_id                       bigserial PRIMARY KEY,
	event_id                        bigint NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,

	first_name                      varchar(255) NOT NULL,
	last_name                       varchar(255) NOT NULL,
	flight_number                   varchar(50)  NOT NULL,

	-- All times stored as UTC
	arrival_time                    timestamptz  NOT NULL,
	departure_time                  timestamptz  NOT NULL,
	vehicle_standby_arrival_time    timestamptz  NOT NULL,
	vehicle_standby_departure_time  timestamptz  NOT NULL,

	-- Hotel mapping (optional FK + denormalized label)
	property_id                     bigint REFERENCES "EventHotel"(id) ON DELETE SET NULL,
	property_name                   varchar(255) NOT NULL,

	status                          varchar(16)  NOT NULL DEFAULT 'pending'
		CHECK (status IN ('default','pending','arrived','delay','no_show','rescheduled')),

	created_at                      timestamptz  NOT NULL DEFAULT now(),
	updated_at                      timestamptz  NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_flightschedule_updated
BEFORE UPDATE ON "FlightSchedule"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Deduplicate common duplicates from re-uploads (tune as needed)
CREATE UNIQUE INDEX uniq_flightschedule_dedupe
ON "FlightSchedule"(event_id, flight_number, arrival_time, last_name);

-- Lookups
CREATE INDEX idx_flightschedule_event_id        ON "FlightSchedule"(event_id);
CREATE INDEX idx_flightschedule_status          ON "FlightSchedule"(status);
CREATE INDEX idx_flightschedule_arrival_time    ON "FlightSchedule"(arrival_time);
CREATE INDEX idx_flightschedule_departure_time  ON "FlightSchedule"(departure_time);
CREATE INDEX idx_flightschedule_property_id     ON "FlightSchedule"(property_id);

-- Event Tasks
CREATE TABLE "EventTask" (
	id              bigserial PRIMARY KEY,
	event_id        bigint NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
	name            varchar(255) NOT NULL,
	description     text,
	deadline        timestamptz NOT NULL,
	priority        varchar(16) NOT NULL DEFAULT 'medium' 
		CHECK (priority IN ('urgent', 'high', 'medium', 'low')),
	status          varchar(16) NOT NULL DEFAULT 'active' 
		CHECK (status IN ('active', 'completed')),
	created_by      bigint NOT NULL REFERENCES "User"(id) ON DELETE RESTRICT,
	created_at      timestamptz NOT NULL DEFAULT now(),
	updated_at      timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_event_task_updated
BEFORE UPDATE ON "EventTask"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Indexes for EventTask
CREATE INDEX idx_event_task_event_id    ON "EventTask"(event_id);
CREATE INDEX idx_event_task_status      ON "EventTask"(status);
CREATE INDEX idx_event_task_priority    ON "EventTask"(priority);
CREATE INDEX idx_event_task_deadline    ON "EventTask"(deadline);
CREATE INDEX idx_event_task_created_by  ON "EventTask"(created_by);

-- Driver Management
CREATE TABLE "Driver" (
  id                    bigserial PRIMARY KEY,
  event_id              bigint NOT NULL REFERENCES "Event"(id) ON DELETE CASCADE,
  full_name             varchar(255) NOT NULL,
  national_id           varchar(50) NOT NULL UNIQUE,
  nationality           varchar(100) NOT NULL,
  phone_number          varchar(20) NOT NULL,
  photo_base64          text, -- Store base64 encoded image (max 5MB)
  status                varchar(20) NOT NULL DEFAULT 'active' 
    CHECK (status IN ('active', 'inactive', 'suspended')),
  created_at            timestamptz NOT NULL DEFAULT now(),
  updated_at            timestamptz NOT NULL DEFAULT now()
);

CREATE TRIGGER trg_driver_updated
BEFORE UPDATE ON "Driver"
FOR EACH ROW EXECUTE FUNCTION set_updated_at();

-- Driver indexes
CREATE INDEX idx_driver_event_id ON "Driver"(event_id);
CREATE INDEX idx_driver_status ON "Driver"(status);
CREATE INDEX idx_driver_national_id ON "Driver"(national_id);
CREATE INDEX idx_driver_created_at ON "Driver"(created_at);

-- Insert default system roles
INSERT INTO "Role" (name, display_name, description, is_system) VALUES
('super_admin', 'Super Administrator', 'Full system access with user management', true),
('admin', 'Administrator', 'Event and user management', true),
('event_manager', 'Event Manager', 'Event creation and management', true),
('coordinator', 'Coordinator', 'Event coordination and task management', true),
('viewer', 'Viewer', 'Read-only access to events', true);

-- Insert default permissions
INSERT INTO "Permission" (resource, action, description, is_system) VALUES
-- User management
('user', 'create', 'Create new users', true),
('user', 'read', 'View user information', true),
('user', 'update', 'Update user information', true),
('user', 'delete', 'Delete users', true),
('user', 'assign_roles', 'Assign roles to users', true),

-- Event management
('event', 'create', 'Create new events', true),
('event', 'read', 'View event information', true),
('event', 'update', 'Update event information', true),
('event', 'delete', 'Delete events', true),

-- Task management
('task', 'create', 'Create new tasks', true),
('task', 'read', 'View task information', true),
('task', 'update', 'Update task information', true),
('task', 'delete', 'Delete tasks', true),

-- Flight schedules
('flight_schedule', 'create', 'Create flight schedules', true),
('flight_schedule', 'read', 'View flight schedules', true),
('flight_schedule', 'update', 'Update flight schedules', true),
('flight_schedule', 'delete', 'Delete flight schedules', true),
('flight_schedule', 'upload', 'Upload flight schedule files', true),

-- Driver management
('driver', 'create', 'Create new drivers', true),
('driver', 'read', 'View driver information', true),
('driver', 'update', 'Update driver information', true),
('driver', 'delete', 'Delete drivers', true);

-- Create initial system user for role assignments (this will be replaced during migration)
-- We'll use a temporary approach that doesn't violate foreign key constraints
DO $$
DECLARE
    super_admin_role_id bigint;
    admin_role_id bigint;
    event_manager_role_id bigint;
    coordinator_role_id bigint;
    viewer_role_id bigint;
BEGIN
    -- Get role IDs
    SELECT id INTO super_admin_role_id FROM "Role" WHERE name = 'super_admin';
    SELECT id INTO admin_role_id FROM "Role" WHERE name = 'admin';
    SELECT id INTO event_manager_role_id FROM "Role" WHERE name = 'event_manager';
    SELECT id INTO coordinator_role_id FROM "Role" WHERE name = 'coordinator';
    SELECT id INTO viewer_role_id FROM "Role" WHERE name = 'viewer';
    
    -- Assign permissions to super_admin role (gets all permissions)
    INSERT INTO "RolePermission" (role_id, permission_id, granted_by)
    SELECT super_admin_role_id, p.id, NULL FROM "Permission" p;
    
    -- Assign permissions to admin role
    INSERT INTO "RolePermission" (role_id, permission_id, granted_by)
    SELECT admin_role_id, p.id, NULL FROM "Permission" p
    WHERE p.resource IN ('user', 'event', 'task', 'flight_schedule', 'driver')
    AND p.action IN ('create', 'read', 'update');
    
    -- Assign permissions to event_manager role
    INSERT INTO "RolePermission" (role_id, permission_id, granted_by)
    SELECT event_manager_role_id, p.id, NULL FROM "Permission" p
    WHERE p.resource IN ('event', 'task', 'flight_schedule', 'driver')
    AND p.action IN ('create', 'read', 'update');
    
    -- Assign permissions to coordinator role
    INSERT INTO "RolePermission" (role_id, permission_id, granted_by)
    SELECT coordinator_role_id, p.id, NULL FROM "Permission" p
    WHERE p.resource IN ('task', 'flight_schedule', 'driver')
    AND p.action IN ('create', 'read', 'update');
    
    -- Assign permissions to viewer role
    INSERT INTO "RolePermission" (role_id, permission_id, granted_by)
    SELECT viewer_role_id, p.id, NULL FROM "Permission" p
    WHERE p.resource IN ('event', 'task', 'flight_schedule', 'driver')
    AND p.action IN ('read');
END $$;

-- =============================================================================
-- MIGRATION SCRIPT (Run this if upgrading from old Account table)
-- =============================================================================
/*
-- Step 1: Create new User table with existing data
CREATE TABLE "User_new" AS SELECT * FROM "Account";

-- Step 2: Add new columns with default values
ALTER TABLE "User_new" 
ADD COLUMN first_name varchar(100) DEFAULT 'User',
ADD COLUMN last_name varchar(100) DEFAULT 'Account',
ADD COLUMN display_name varchar(150),
ADD COLUMN avatar_url varchar(500),
ADD COLUMN phone varchar(20),
ADD COLUMN department varchar(100),
ADD COLUMN position varchar(100),
ADD COLUMN employee_id varchar(50),
ADD COLUMN hire_date date,
ADD COLUMN last_activity_at timestamptz;

-- Step 3: Update display_name from username
UPDATE "User_new" SET display_name = username WHERE display_name IS NULL;

-- Step 4: Rename tables
ALTER TABLE "Account" RENAME TO "Account_old";
ALTER TABLE "User_new" RENAME TO "User";

-- Step 5: Update foreign key references
ALTER TABLE "Event" DROP CONSTRAINT IF EXISTS "Event_created_by_fkey";
ALTER TABLE "Event" ADD CONSTRAINT "Event_created_by_fkey" 
FOREIGN KEY (created_by) REFERENCES "User"(id);

ALTER TABLE "EventTask" DROP CONSTRAINT IF EXISTS "EventTask_created_by_fkey";
ALTER TABLE "EventTask" ADD CONSTRAINT "EventTask_created_by_fkey" 
FOREIGN KEY (created_by) REFERENCES "User"(id);

-- Step 6: Update role permissions to reference the first user
UPDATE "RolePermission" 
SET granted_by = 1 
WHERE granted_by IS NULL;

-- Step 7: Add foreign key constraint for granted_by
ALTER TABLE "RolePermission" ADD CONSTRAINT fk_rolepermission_granted_by 
FOREIGN KEY (granted_by) REFERENCES "User"(id);

-- Step 8: Make granted_by NOT NULL
ALTER TABLE "RolePermission" ALTER COLUMN granted_by SET NOT NULL;

-- Step 9: Create first super admin user (assuming first user should be admin)
INSERT INTO "UserRole" (user_id, role_id, assigned_by)
SELECT u.id, r.id, u.id 
FROM "User" u, "Role" r 
WHERE u.id = 1 AND r.name = 'super_admin';

-- Step 10: Verify and drop old table (after testing)
-- DROP TABLE "Account_old";
*/