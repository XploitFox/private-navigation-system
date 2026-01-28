import { JSONFileStore } from '../utils/jsonStore.js';
import { config } from '../config/env.js';
import bcrypt from 'bcryptjs';

export interface User {
  username: string;
  password_hash: string;
  email?: string;
  created_at: string;
  last_login?: string;
}

interface UserData {
  users: User[];
}

const userStore = new JSONFileStore<UserData>('users.json', { users: [] });

export const UserModel = {
  async findByUsername(username: string): Promise<User | undefined> {
    const data = await userStore.read();
    return data.users.find((u) => u.username === username);
  },

  async createUser(user: User): Promise<void> {
    const data = await userStore.read();
    data.users.push(user);
    await userStore.write(data);
  },

  async updateLastLogin(username: string): Promise<void> {
    const data = await userStore.read();
    const user = data.users.find((u) => u.username === username);
    if (user) {
      user.last_login = new Date().toISOString();
      await userStore.write(data);
    }
  },

  async initAdmin() {
    const admin = await this.findByUsername(config.adminUsername);
    if (!admin) {
      const salt = await bcrypt.genSalt(10);
      const hash = await bcrypt.hash(config.adminPassword, salt);
      await this.createUser({
        username: config.adminUsername,
        password_hash: hash,
        created_at: new Date().toISOString(),
      });
      console.log('Admin user initialized');
    }
  },
};
