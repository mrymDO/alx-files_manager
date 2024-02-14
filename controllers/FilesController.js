import { getUserByToken } from '../utils/user';
import { validateBody, isValidId, saveFile } from '../utils/file';

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
}

export default FilesController;
