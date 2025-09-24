import express from 'express';
import multer from 'multer';
import { handleUploadAndSend } from '../controllers/uploadController.js'; 

const router = express.Router();
const upload = multer({ dest: '/tmp' });

router.post('/upload-and-send', upload.single('excelFile'), handleUploadAndSend);

export default router;