import { ObjectId } from 'mongodb';
import { v4 as uuidv4 } from 'uuid';
import { promises as fsPromises } from 'fs';
import dbClient from './db';
import { getUserByToken } from './user';

export async function getFile(query) {
  const files = await dbClient.filesCollection();
  const file = files.findOne(query);
  return file;
}

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
      file = await getFile({
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

export function processFile(doc) {
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

export async function getFilesOfParentId(query) {
  const filesList = await dbClient.filesCollection();
  const fileList = await filesList.aggregate(query);
  return fileList;
}

async function updateFile(query, set) {
  const fileLists = await dbClient.filesCollection();
  const fileList = await fileLists.findOneAndUpdate(
    query,
    set,
    { returnOriginal: false },
  );
  return fileList;
}

export async function publishUnpublish(request, setPublish) {
  const { id: fileId } = request.params;
  const xToken = request.header('X-Token');

  if (!isValidId(fileId)) { return { error: 'Unauthorized', code: 401 }; }

  const user = await getUserByToken(xToken);

  if (!user) { return { error: 'Unauthorized', code: 401 }; }

  const file = await getFile({
    _id: ObjectId(fileId),
    userId: ObjectId(user._id),
  });

  if (!file) return { error: 'Not found', code: 404 };

  const result = await updateFile(
    {
      _id: ObjectId(fileId),
      userId: ObjectId(user._id),
    },
    { $set: { isPublic: setPublish } },
  );

  const {
    _id: id,
    userId: resultUserId,
    name,
    type,
    isPublic,
    parentId,
  } = result.value;

  const updatedFile = {
    id,
    userId: resultUserId,
    name,
    type,
    isPublic,
    parentId,
  };

  return { error: null, code: 200, updatedFile };
}

export function isOwnerAndPublic(file, userId) {
  if (
    (!file.isPublic && !userId)
    || (userId && file.userId.toString() !== userId && !file.isPublic)
  ) { return false; }

  return true;
}

export async function getFileData(file, size) {
  let { localPath } = file;
  let data;

  if (size) localPath = `${localPath}_${size}`;

  try {
    data = await fsPromises.readFile(localPath);
  } catch (err) {
    // console.log(err.message);
    return { error: 'Not found', code: 404 };
  }

  return { data };
}
