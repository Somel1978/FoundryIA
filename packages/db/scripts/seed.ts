import { strToU8 } from "fflate";
import { eq } from "drizzle-orm";
import { writeSnapshot } from "@foundry/storage";
import { getDb, projects, releases, snapshots } from "../src/index";

const db = getDb();
const slug = "hello-foundry";

if (db.select().from(projects).where(eq(projects.slug, slug)).get()) {
  console.log(`Seed project "${slug}" already exists.`);
  process.exit(0);
}

const project = db
  .insert(projects)
  .values({
    slug,
    name: "Hello FoundryVTTAI",
    description: "A tiny sample project created by the seed script.",
    visibility: "public",
  })
  .returning()
  .get();

const snapshot = db.insert(snapshots).values({ projectId: project.id, message: "Initial import" }).returning().get();

const stats = await writeSnapshot(snapshot.id, [
  { path: "README.md", data: strToU8("# Hello FoundryVTTAI\n\nA sample project. Try suggesting a fix!\n") },
  {
    path: "src/greet.ts",
    data: strToU8('export function greet(name: string): string {\n  return "Helo, " + name + "!";\n}\n'),
  },
  { path: "package.json", data: strToU8('{\n  "name": "hello-foundry",\n  "version": "1.0.0"\n}\n') },
]);

db.update(snapshots).set(stats).where(eq(snapshots.id, snapshot.id)).run();
db.update(projects).set({ currentSnapshotId: snapshot.id }).where(eq(projects.id, project.id)).run();
db.insert(releases)
  .values({
    projectId: project.id,
    tag: "v1.0.0",
    title: "First release",
    notes: "Initial public release.",
    published: true,
    publishedAt: new Date(),
  })
  .run();

console.log(`Seeded project "${slug}".`);
