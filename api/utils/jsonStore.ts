import fs from 'fs/promises';
import path from 'path';

export class JSONFileStore<T> {
  private filePath: string;
  private defaultData: T;

  constructor(filename: string, defaultData: T) {
    // Ensure we're pointing to the correct data directory
    // In dev mode (ts-node), process.cwd() is project root
    // api/data is where we want to store it
    this.filePath = path.join(process.cwd(), 'api', 'data', filename);
    this.defaultData = defaultData;
    console.log(`[JSONStore] Initialized for ${filename} at ${this.filePath}`);
  }

  private async ensureFile(): Promise<void> {
    try {
      await fs.access(this.filePath);
    } catch {
      await fs.mkdir(path.dirname(this.filePath), { recursive: true });
      await fs.writeFile(this.filePath, JSON.stringify(this.defaultData, null, 2));
    }
  }

  async read(): Promise<T> {
    await this.ensureFile();
    const data = await fs.readFile(this.filePath, 'utf-8');
    return JSON.parse(data) as T;
  }

  async write(data: T): Promise<void> {
    await this.ensureFile();
    await fs.writeFile(this.filePath, JSON.stringify(data, null, 2));
  }
}
