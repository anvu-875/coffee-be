import prisma from '@/db/prisma';

class UserService {
  private static instance: UserService | null = null;

  private constructor() {}

  static getInstance() {
    if (UserService.instance === null) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  validateEmail(email: string) {
    return email.match(
      /^(([^<>()[\]\\.,;:\s@\"]+(\.[^<>()[\]\\.,;:\s@\"]+)*)|(\".+\"))@((\[[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\.[0-9]{1,3}\])|(([a-zA-Z\-0-9]+\.)+[a-zA-Z]{2,}))$/
    );
  }
}

export default UserService.getInstance();
