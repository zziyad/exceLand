/**
 * Get tasks for an event with optional filtering and sorting
 * @param {number} eventId - Event ID
 * @param {Object} options - Query options
 * @param {string} [options.status] - Filter by status (active, completed)
 * @param {string} [options.priority] - Filter by priority (urgent, high, medium, low)
 * @param {string} [options.search] - Search in name and description
 * @param {number} [options.created_by] - Filter by user who created the task
 * @param {string} [options.sort_by] - Sort field (deadline, priority, created_at)
 * @param {string} [options.sort_order] - Sort order (asc, desc)
 * @param {number} [options.limit] - Maximum number of results
 * @param {number} [options.offset] - Number of results to skip
 * @returns {Promise<Object>} Tasks and metadata
 */
async (eventId, options = {}) => {
  const {
    status,
    priority,
    search,
    created_by,
    sort_by = 'deadline',
    sort_order = 'asc',
    limit = 100,
    offset = 0,
  } = options;

  if (!eventId) {
    throw new Error('eventId is required');
  }

  // Build WHERE clause
  const whereConditions = ['event_id = $1'];
  const values = [eventId];
  let paramCount = 1;

  if (search) {
    paramCount++;
    whereConditions.push(
      `(t.name ILIKE $${paramCount} OR t.description ILIKE $${paramCount})`,
    );
    values.push(`%${search}%`);
  }

  if (status) {
    paramCount++;
    whereConditions.push(`t.status = $${paramCount}`);
    values.push(status);
  }

  if (priority) {
    paramCount++;
    whereConditions.push(`t.priority = $${paramCount}`);
    values.push(priority);
  }

  if (created_by) {
    paramCount++;
    whereConditions.push(`t.created_by = $${paramCount}`);
    values.push(created_by);
  }

  // Validate sort fields
  const validSortFields = ['deadline', 'priority', 'created_at', 'name'];
  if (!validSortFields.includes(sort_by)) {
    throw new Error('Invalid sort_by field');
  }

  const validSortOrders = ['asc', 'desc'];
  if (!validSortOrders.includes(sort_order.toLowerCase())) {
    throw new Error('Invalid sort_order. Must be asc or desc');
  }

  // Build ORDER BY clause with priority ordering
  let orderByClause;
  if (sort_by === 'priority') {
    orderByClause = `
      CASE priority 
        WHEN 'urgent' THEN 4 
        WHEN 'high' THEN 3 
        WHEN 'medium' THEN 2 
        WHEN 'low' THEN 1 
      END ${sort_order.toUpperCase()}
    `;
  } else {
    orderByClause = `${sort_by} ${sort_order.toUpperCase()}`;
  }

  try {
    // Get total count
    const countQuery = `
      SELECT COUNT(*) as total
      FROM "EventTask"
      WHERE ${whereConditions.join(' AND ')}
    `;
    const countResult = await db.pg.query(countQuery, values);
    const total = parseInt(countResult.rows[0].total);

    // Get tasks with pagination
    const tasksQuery = `
      SELECT 
        t.*,
        a.username as created_by_username,
        a.email as created_by_email
      FROM "EventTask" t
      LEFT JOIN "Account" a ON t.created_by = a.id
      WHERE ${whereConditions.join(' AND ')}
      ORDER BY ${orderByClause}
      LIMIT $${paramCount + 1} OFFSET $${paramCount + 2}
    `;

    const paginatedValues = [...values, limit, offset];
    const tasksResult = await db.pg.query(tasksQuery, paginatedValues);

    return {
      tasks: tasksResult.rows,
      pagination: {
        total,
        limit,
        offset,
        hasMore: offset + limit < total,
      },
    };
  } catch (error) {
    throw error;
  }
};

/**
 * Get a single task by ID
 * @param {number} taskId - Task ID
 * @param {number} eventId - Event ID (for security)
 * @returns {Promise<Object>} Task details
 */
// async function getTask(taskId, eventId) {
//   if (!taskId || !eventId) {
//     throw new Error('taskId and eventId are required')
//   }

//   try {
//     const query = `
//       SELECT
//         t.*,
//         a.username as created_by_username,
//         a.email as created_by_email
//       FROM "EventTask" t
//       LEFT JOIN "Account" a ON t.created_by = a.id
//       WHERE t.id = $1 AND t.event_id = $2
//     `

//     const result = await db.query(query, [taskId, eventId])

//     if (result.rows.length === 0) {
//       throw new Error('Task not found')
//     }

//     return result.rows[0]
//   } catch (error) {
//     throw error
//   }
// }
