import prisma from '@/db/prisma';
import { generateFromEmail } from 'unique-username-generator';

class UserService {
  private static instance: UserService | null = null;

  static getInstance() {
    if (UserService.instance === null) {
      UserService.instance = new UserService();
    }
    return UserService.instance;
  }

  /**
   * Find a user by ID
   */
  async findUserById(id: string) {
    return await prisma.user.findUnique({ where: { id } });
  }

  /**
   * Find a user by email
   */
  async findUserByEmail(email: string) {
    return await prisma.user.findUnique({ where: { email } });
  }

  /**
   * Create a user without a name (for registration)
   */
  async createUserWithoutName(email: string, passwordHash: string) {
    const name = generateFromEmail(email, 4);
    return await prisma.user.create({
      data: { email, passwordHash, name }
    });
  }
}

export default UserService.getInstance();
