({
  generateToken() {
    const { characters, secret, length } = config.sessions;
    return metarhia.metautil.generateToken(secret, characters, length);
  },
  otp() {
    return Math.floor(1000 + Math.random() * 9000).toString();
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
