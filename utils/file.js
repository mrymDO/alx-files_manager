import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';

export function isValidId(id) {
  try {
    ObjectId(id);
  } catch (err) {
    return false;
  }
  return true;
}

export async function validateBody(request) {
  const {
    name, type, isPublic = false, data,
  } = request.body;

  let { parentId = 0 } = request.body;

  const typesAllowed = ['file', 'image', 'folder'];
  let msg = null;

  if (parentId === '0') parentId = 0;

  if (!name) {
    msg = 'Missing name';
  } else if (!type || !typesAllowed.includes(type)) {
    msg = 'Missing type';
  } else if (!data && type !== 'folder') {
    msg = 'Missing data';
  } else if (parentId && parentId !== '0') {
    let file = null;

    if (isValidId(parentId)) {
      file = await this.getFile({
        _id: ObjectId(parentId),
      });
    }

    if (!file) {
      msg = 'Parent not found';
    } else if (file.type !== 'folder') {
      msg = 'Parent is not a folder';
    }
  }

  const obj = {
    error: msg,
    fileParams: {
      name,
      type,
      parentId,
      isPublic,
      data,
    },
  };

  return obj;
}

function processFile(doc) {
  // Changes _id for id and removes localPath

  const file = { id: doc._id, ...doc };

  delete file.localPath;
  delete file._id;

  return file;
}

export async function saveFile(userId, fileParams, FOLDER_PATH) {
  const {
    name, type, isPublic, data,
  } = fileParams;
  let { parentId } = fileParams;

  if (parentId !== 0) parentId = ObjectId(parentId);

  const query = {
    userId: ObjectId(userId),
    name,
    type,
    isPublic,
    parentId,
  };

  if (fileParams.type !== 'folder') {
    const fileNameUUID = uuidv4();

    // const fileDataDecoded = Buffer.from(data, 'base64').toString('utf-8');
    const fileDataDecoded = Buffer.from(data, 'base64');

    const path = `${FOLDER_PATH}/${fileNameUUID}`;

    query.localPath = path;

    try {
      await fsPromises.mkdir(FOLDER_PATH, { recursive: true });
      await fsPromises.writeFile(path, fileDataDecoded);
    } catch (err) {
      return { error: err.message, code: 400 };
    }
  }

  const files = await dbClient.filesCollection();
  const result = await files.insertOne(query);
  const file = processFile(query);

  const newFile = { id: result.insertedId, ...file };

  return { error: null, newFile };
}
