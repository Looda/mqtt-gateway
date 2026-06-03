import path from 'path';
import { fileURLToPath } from 'url';

const __filename = fileURLToPath(import.meta.url);
const __dirname = path.dirname(__filename);

const getDirPath = (...pathNames: string[]) => {
  return path.join(__dirname, ...pathNames);
}

export default getDirPath;