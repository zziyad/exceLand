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

  otp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
  },

  async registerUser(
    username,
    email,
    password,
    profile_picture = 'https://cdn.pixabay.com/photo/2015/10/05/22/37/blank-profile-picture-973460_960_720.png',
    is_admin = false,
  ) {
    return db.pg.insert('users', {
      username,
      email,
      password,
      profile_picture,
      is_admin,
    });
  },

  async getUser(email) {
    return db.pg.row('users', { email });
  },

  async createUser(userData) {
    return prisma.user.create({ data: userData });
  },

  async getUserById(id) {
    return prisma.user.findUnique({ where: { id } });
  },

  async getAllUsers() {
    return prisma.user.findMany();
  },

  async getActiveUsers() {
    return prisma.user.findMany({ where: { isActive: true } });
  },

  async updateUser(id, updateData) {
    return prisma.user.update({ where: { id }, data: updateData });
  },

  async deactivateUser(id) {
    return prisma.user.update({ where: { id }, data: { isActive: false } });
  },

  async toggleUserStatus(id) {
    const user = await prisma.user.findUnique({ where: { id } });
    if (!user) throw new Error('User not found');

    return prisma.user.update({
      where: { id },
      data: { isActive: !user.isActive },
    });
  },
});
