import express from 'express';
import AppController from '../controllers/AppController';
import UsersController from '../controllers/UsersController';
import AuthControllers from '../controllers/AuthController';
import FilesController from '../controllers/FilesController';

const router = express.Router();

router.get('/status', AppController.getStatus);
router.get('/stats', AppController.getStats);
router.post('/users', UsersController.postNew);
router.get('/connect', AuthControllers.getConnect);
router.get('/disconnect', AuthControllers.getDisconnect);
router.get('/users/me', UsersController.getMe);
router.get('/files', FilesController.postUpload);

module.exports = router;
