import { ObjectId } from 'mongodb';
import { getUserByToken } from '../utils/user';
import {
  validateBody, getFile, processFile,
  isValidId, saveFile, getFilesOfParentId,
} from '../utils/file';

const FOLDER_PATH = process.env.FOLDER_PATH || '/tmp/files_manager';

class FilesController {
  static async postUpload(req, res) {
    const xToken = req.header('X-Token') || '';
    const user = await getUserByToken(xToken);
    if (!user) {
      return res.status(401).send({ error: 'Unauthorized' });
    }

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    const { error: validationError, fileParams } = await validateBody(req);

    if (validationError) { return res.status(400).send({ error: validationError }); }

    if (fileParams.parentId !== 0 && !isValidId(fileParams.parentId)) { return res.status(400).send({ error: 'Parent not found' }); }

    const { error, code, newFile } = await saveFile(
      user._id,
      fileParams,
      FOLDER_PATH,
    );

    if (error) {
      return res.status(code).send(error);
    }

    return res.status(201).send(newFile);
  }

  static async getShow(req, res) {
    const fileId = req.params.id;
    const xToken = req.header('X-Token');

    const user = await getUserByToken(xToken);

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    if (!isValidId(fileId) || !isValidId(user._id)) return res.status(404).send({ error: 'Not found' });

    const result = await getFile({
      _id: ObjectId(fileId),
      userId: ObjectId(user._id),
    });

    if (!result) return res.status(404).send({ error: 'Not found' });

    const file = processFile(result);

    return res.status(200).send(file);
  }

  static async getIndex(req, res) {
    const xToken = req.header('X-Token');
    const user = await getUserByToken(xToken);

    if (!user) return res.status(401).send({ error: 'Unauthorized' });

    let parentId = req.query.parentId || '0';

    if (parentId === '0') parentId = 0;

    let page = Number(req.query.page) || 0;

    if (Number.isNaN(page)) page = 0;

    if (parentId !== 0 && parentId !== '0') {
      if (!isValidId(parentId)) { return res.status(401).send({ error: 'Unauthorized' }); }

      parentId = ObjectId(parentId);

      const folder = await getFile({
        _id: ObjectId(parentId),
      });

      if (!folder || folder.type !== 'folder') { return res.status(200).send([]); }
    }

    const pipeline = [
      { $match: { parentId } },
      { $skip: page * 20 },
      {
        $limit: 20,
      },
    ];

    const fileCursor = await getFilesOfParentId(pipeline);

    const fileList = [];
    await fileCursor.forEach((doc) => {
      const document = processFile(doc);
      fileList.push(document);
    });

    return res.status(200).send(fileList);
  }
}

export default FilesController;
