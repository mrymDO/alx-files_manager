import { ObjectId } from 'mongodb';
import RedisClient from './redis';
import dbClient from './db';

export async function getUserById(id) {
  const users = await dbClient.usersCollection();
  const user = await users.findOne({
    _id: ObjectId(id),
  });
  return user;
}

export async function getUserByToken(token) {
  const userID = await RedisClient.get(`auth_${token}`);
  if (!userID) return null;
  const user = await getUserById(userID);
  return user;
}
