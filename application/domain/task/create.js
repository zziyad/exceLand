/**
 * Create a new task for an event
 * @param {Object} taskData - Task data
 * @param {number} taskData.event_id - Event ID
 * @param {string} taskData.name - Task name
 * @param {string} taskData.description - Task description
 * @param {string} taskData.deadline - Task deadline (ISO string)
 * @param {string} taskData.priority - Task priority (urgent, high, medium, low)
 * @param {number} taskData.created_by - User ID who created the task
 * @returns {Promise<Object>} Created task
 */
async (taskData) => {
  const { event_id, name, description, deadline, priority, created_by } =
    taskData;

  console.log('taskData', taskData);

  // Validate required fields
  if (!event_id || !name || !deadline || !priority || !created_by) {
    throw new Error(
      'Missing required fields: event_id, name, deadline, priority, created_by',
    );
  }

  // Validate priority values
  const validPriorities = ['urgent', 'high', 'medium', 'low'];
  if (!validPriorities.includes(priority)) {
    throw new Error(
      'Invalid priority value. Must be one of: urgent, high, medium, low',
    );
  }

  // Validate deadline is in the future
  const deadlineDate = new Date(deadline);
  if (deadlineDate <= new Date()) {
    throw new Error('Deadline must be in the future');
  }

  try {
    const query = `
      INSERT INTO "EventTask" (
        event_id, name, description, deadline, priority, created_by
      ) VALUES ($1, $2, $3, $4, $5, $6)
      RETURNING *
    `;

    const values = [
      event_id,
      name,
      description,
      deadline,
      priority,
      created_by,
    ];
    const result = await db.pg.query(query, values);

    if (result.rows.length === 0) {
      throw new Error('Failed to create task');
    }

    return result.rows[0];
  } catch (error) {
    if (error.code === '23503') {
      // Foreign key violation
      throw new Error('Invalid event_id or created_by user');
    }
    throw error;
  }
};
