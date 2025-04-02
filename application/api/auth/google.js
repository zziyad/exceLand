({
  access: 'public',
  method: async () => {
    const roles = [
      'REQUESTOR',
      'DEPARTMENT_MANAGER',
      'FINANCIAL_DIRECTOR',
      'GENERAL_DIRECTOR',
      'SECURITY',
      'ADMIN',
    ];

    for (const role of roles) {
      await prisma.role.upsert({
        where: { name: role },
        update: {},
        create: { name: role },
      });
    }
    console.log('Roles seeded successfully!');

    return 'OK';
  },
});
