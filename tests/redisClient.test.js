import { expect } from 'chai';
import redisClient from '../utils/redis';

describe('Redis Client Tests', () => {
  before(async () => {
  });

  after(async () => {
  });

  it('Set and Get', async () => {
    const key = 'testKey';
    const value = 'testValue';

    await redisClient.set(key, value);

    const retrievedValue = await redisClient.get(key);

    expect(retrievedValue).to.equal(value);
  });

  it('Delete Key', async () => {
    const key = 'keyToDelete';

    await redisClient.set(key, 'valueToDelete');

    await redisClient.del(key);

    const retrievedValue = await redisClient.get(key);

    expect(retrievedValue).to.be.null;
  });
});