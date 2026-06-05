// File Purpose: Multer upload configuration for handling resume image files.
import multer from 'multer';

const storage = multer.diskStorage({})

const upload = multer({ storage })

export default upload;