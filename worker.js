import Queue from 'bull';
import { ObjectId } from 'mongodb';
import { promises as fsPromises } from 'fs';
import { getFile, isValidId } from './utils/file';

const imageThumbnail = require('image-thumbnail');

const fileQueue = new Queue('fileQueue');

fileQueue.process(async (job) => {
  const { fileId, userId } = job.data;

  if (!userId) {
    console.log('Missing userId');
    throw new Error('Missing userId');
  }

  if (!fileId) {
    console.log('Missing fileId');
    throw new Error('Missing fileId');
  }

  if (!isValidId(fileId) || !isValidId(userId)) throw new Error('File not found');

  const file = await getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(userId),
  });

  if (!file) throw new Error('File not found');

  const { localPath } = file;
  const options = {};
  const widths = [500, 250, 100];

  widths.forEach(async (width) => {
    options.width = width;
    try {
      const thumbnail = await imageThumbnail(localPath, options);
      await fsPromises.writeFile(`${localPath}_${width}`, thumbnail);
    } catch (err) {
      console.error(err.message);
    }
  });
});

export default fileQueue;
