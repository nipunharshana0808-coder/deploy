import fs from "fs/promises";
import path from "path";

const DATA_DIR = path.join(process.cwd(), ".dev-data");

async function ensureDataDir() {
  await fs.mkdir(DATA_DIR, { recursive: true });
}

function collectionPath(collection: string) {
  return path.join(DATA_DIR, `${collection}.json`);
}

async function readJson<T>(filePath: string, fallback: T): Promise<T> {
  try {
    const raw = await fs.readFile(filePath, "utf8");
    return JSON.parse(raw) as T;
  } catch {
    return fallback;
  }
}

async function writeJson(filePath: string, data: any) {
  await ensureDataDir();
  await fs.writeFile(filePath, JSON.stringify(data, null, 2), "utf8");
}

export async function readCollectionStore(collection: string) {
  await ensureDataDir();
  return readJson<any[]>(collectionPath(collection), []);
}

export async function writeCollectionStore(collection: string, records: any[]) {
  await writeJson(collectionPath(collection), records);
  return records;
}

export async function getCollectionRecord(collection: string, id: string) {
  const records = await readCollectionStore(collection);
  return records.find((item) => String(item.id) === String(id)) || null;
}

export async function upsertCollectionRecord(collection: string, id: string, record: any) {
  const records = await readCollectionStore(collection);
  const next = [...records.filter((item) => String(item.id) !== String(id)), { ...record, id }];
  await writeCollectionStore(collection, next);
  return { ...record, id };
}

export async function deleteCollectionRecord(collection: string, id: string) {
  const records = await readCollectionStore(collection);
  const next = records.filter((item) => String(item.id) !== String(id));
  await writeCollectionStore(collection, next);
}

export async function appendCollectionRecord(collection: string, record: any) {
  const records = await readCollectionStore(collection);
  const next = [...records, record];
  await writeCollectionStore(collection, next);
  return record;
}
