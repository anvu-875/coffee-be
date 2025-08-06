import prisma from '@/db/prisma';

class UserService {
  private static instance: UserService | null = null;

  static getInstance() {
    if (UserService.instance === null) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }
}

export default UserService.getInstance();
