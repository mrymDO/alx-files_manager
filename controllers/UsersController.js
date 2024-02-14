import sha1 from 'sha1';
import { ObjectId } from 'mongodb';
import dbClient from '../utils/db';
import redisClient from '../utils/redis';

class UsersController {
  static async postNew(req, res) {
    try {
      console.log('Request Body:', req.body);
      const { email, password } = req.body;
      if (!email) {
        return res.status(400).json({ error: 'Missing email' });
      }
      if (!password) {
        return res.status(400).json({ error: 'Missing password' });
      }

      const hashedPassword = sha1(password);
      const collection = await dbClient.usersCollection();
      const existingUser = await collection.findOne({ email });
      if (existingUser) {
        return res.status(400).json({ error: 'Already exist' });
      }
      const { insertedId } = await collection.insertOne({ email, password: hashedPassword });
      const newUser = await collection.findOne({ _id: insertedId });
      return res.status(201).json({ id: newUser._id, email: newUser.email });
    } catch (error) {
      console.error(error);
      return res.status(500).json({ error: 'Internal Server Error' });
    }
  }

  static async getMe(req, res) {
    const xToken = req.header('X-Token');

    if (!xToken) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const userID = await redisClient.get(`auth_${xToken}`);

    if (!userID) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    console.log(userID);
    const collection = await dbClient.usersCollection();
    const user = await collection.findOne({
      _id: ObjectId(userID),
    });
    return res.status(200).send({
      id: user._id,
      email: user.email,
    });
  }
}

export default UsersController;
