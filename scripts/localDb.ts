// `npm run db:local` — a real mongod on 127.0.0.1:27017 with its data in
// ./.data/mongo, for working without Docker or an Atlas cluster. Leave it
// running in its own terminal; Ctrl+C stops it and the data stays on disk.
import { mkdirSync } from "node:fs";
import { MongoMemoryServer } from "mongodb-memory-server";

const dbPath = "./.data/mongo";
mkdirSync(dbPath, { recursive: true });

const server = await MongoMemoryServer.create({
  instance: { port: 27017, ip: "127.0.0.1", dbPath, storageEngine: "wiredTiger" },
});
console.log(`mongod ready at ${server.getUri()}hireme (data in ${dbPath})`);

const stop = async () => {
  // doCleanup false keeps the data directory.
  await server.stop({ doCleanup: false });
  process.exit(0);
};
process.on("SIGINT", stop);
process.on("SIGTERM", stop);
