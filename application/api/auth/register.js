({
  access: 'public',
  method: async ({ email, password, role = 'EMPLOYEE', departmentId }) => {
    const appError = await lib.appError();
    // const sendMail = await lib.sendEmail;
    // const { otp } = api.auth.provider();

    console.log({ email, password, role, departmentId });

    try {
      const existingUser = await prisma.user.findUnique({
        where: { email: email },
      });

      console.log({ existingUser: !existingUser });

      if (!!existingUser)
        return {
          status: 'error',
          response: new appError('Email already exists', 400),
        };

      console.log({ role });

      const hash = await metarhia.metautil.hashPassword(password);

      const newUser = await prisma.user.create({
        data: {
          email,
          password: hash,
          role,
          departmentId: parseInt(departmentId),
        },
      });

      // const options = {
      //   email: newUser.email,
      //   subject: 'OTP Email Verification',
      //   html: `<h1>OTP: ${otp()}</h1>`,
      // };

      // console.log('User registered:', newUser);
      // await sendMail(options);

      return {
        status: 'success',
        response: { msg: 'User registered successfully' },
      };
    } catch (e) {
      throw new appError(e.message, 500);
    } finally {
      await prisma.$disconnect();
    }
  },
});
