import { v4 as uuidv4 } from 'uuid';
import sha1 from 'sha1';
import redisClient from '../utils/redis';
import dbClient from '../utils/db';

class AuthControllers {
  static async getConnect(req, res) {
    const authrozation = req.header('Authorization') || '';
    const credentials = authrozation.split(' ')[1];

    if (!credentials) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const [email, password] = Buffer.from(credentials, 'base64').toString('utf8').split(':');

    if (!email || !password) {
      return res.status(401).send({ error: 'Unauthorized' });
    }
    const hashedPassword = sha1(password);
    const users = await dbClient.usersCollection();
    const user = await users.findOne({
      email,
      password: hashedPassword,
    });

    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const token = uuidv4();
    const key = `auth_${token}`;
    const hoursForExpiration = 24;

    await redisClient.set(key, user._id.toString(), hoursForExpiration * 3600);

    return res.status(200).send({ token });
  }

  static async getDisconnect(req, res) {
    const xToken = req.header('X-Token');
    if (!xToken) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    const key = `auth_${xToken}`;
    const userId = await redisClient.get(key);

    if (!userId) return res.status(401).send({ error: 'Unauthorized' });

    await redisClient.del(key);

    return res.status(204).send();
  }
}

export default AuthControllers;
