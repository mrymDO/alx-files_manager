import { expect } from 'chai';
import dbClient from '../utils/db';

describe('DB Client Tests', () => {
  before(async () => {
    await dbClient.client.connect();
  });

  after(async () => {
    await dbClient.client.close();
  });

  it('Check if DB is Alive', () => {
    const isAlive = dbClient.isAlive();

    expect(isAlive).to.be.true;
  });

  it('Retrieve Number of Users', async () => {
    const nbUsers = await dbClient.nbUsers();
    expect(nbUsers).to.be.greaterThan(0);
  });

  it('Retrieve Number of Files', async () => {
    const nbFiles = await dbClient.nbFiles();
    expect(nbFiles).to.be.greaterThan(0);
  });
});
