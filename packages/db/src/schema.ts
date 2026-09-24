import { relations, sql } from "drizzle-orm";
import { index, integer, sqliteTable, text, uniqueIndex } from "drizzle-orm/sqlite-core";

const id = () =>
  text("id")
    .primaryKey()
    .$defaultFn(() => crypto.randomUUID());

const createdAt = () =>
  integer("created_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`);

export const VISIBILITY = ["public", "private"] as const;
export type Visibility = (typeof VISIBILITY)[number];

export const ISSUE_STATUS = ["open", "accepted", "rejected", "closed"] as const;
export type IssueStatus = (typeof ISSUE_STATUS)[number];

export const FIX_STATUS = ["pending", "applied", "rejected"] as const;
export type FixStatus = (typeof FIX_STATUS)[number];

export const projects = sqliteTable("projects", {
  id: id(),
  slug: text("slug").notNull().unique(),
  name: text("name").notNull(),
  description: text("description").notNull().default(""),
  visibility: text("visibility", { enum: VISIBILITY }).notNull().default("private"),
  /** Whether visitors can open issues / propose fixes on a public project. */
  acceptSuggestions: integer("accept_suggestions", { mode: "boolean" }).notNull().default(true),
  currentSnapshotId: text("current_snapshot_id"),
  createdAt: createdAt(),
  updatedAt: integer("updated_at", { mode: "timestamp_ms" })
    .notNull()
    .default(sql`(unixepoch() * 1000)`),
});

/** An immutable upload of a project's source tree. */
export const snapshots = sqliteTable(
  "snapshots",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    message: text("message").notNull().default(""),
    fileCount: integer("file_count").notNull().default(0),
    totalBytes: integer("total_bytes").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("snapshots_project_idx").on(t.projectId)],
);

export const releases = sqliteTable(
  "releases",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    tag: text("tag").notNull(),
    title: text("title").notNull(),
    notes: text("notes").notNull().default(""),
    published: integer("published", { mode: "boolean" }).notNull().default(false),
    publishedAt: integer("published_at", { mode: "timestamp_ms" }),
    createdAt: createdAt(),
  },
  (t) => [uniqueIndex("releases_project_tag_idx").on(t.projectId, t.tag)],
);

export const releaseAssets = sqliteTable(
  "release_assets",
  {
    id: id(),
    releaseId: text("release_id")
      .notNull()
      .references(() => releases.id, { onDelete: "cascade" }),
    filename: text("filename").notNull(),
    contentType: text("content_type").notNull().default("application/octet-stream"),
    size: integer("size").notNull(),
    downloadCount: integer("download_count").notNull().default(0),
    createdAt: createdAt(),
  },
  (t) => [index("release_assets_release_idx").on(t.releaseId)],
);

/** Issues suggested by visitors. */
export const issues = sqliteTable(
  "issues",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    number: integer("number").notNull(),
    title: text("title").notNull(),
    body: text("body").notNull().default(""),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    status: text("status", { enum: ISSUE_STATUS }).notNull().default("open"),
    /** Only issues approved by the admin are listed publicly. */
    isPublic: integer("is_public", { mode: "boolean" }).notNull().default(false),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [
    index("issues_project_idx").on(t.projectId),
    uniqueIndex("issues_project_number_idx").on(t.projectId, t.number),
  ],
);

/** A proposed change to a single file, based on a specific snapshot. */
export const fixSuggestions = sqliteTable(
  "fix_suggestions",
  {
    id: id(),
    projectId: text("project_id")
      .notNull()
      .references(() => projects.id, { onDelete: "cascade" }),
    baseSnapshotId: text("base_snapshot_id")
      .notNull()
      .references(() => snapshots.id, { onDelete: "cascade" }),
    issueId: text("issue_id").references(() => issues.id, { onDelete: "set null" }),
    filePath: text("file_path").notNull(),
    title: text("title").notNull(),
    description: text("description").notNull().default(""),
    proposedContent: text("proposed_content").notNull(),
    diff: text("diff").notNull(),
    authorName: text("author_name").notNull(),
    authorEmail: text("author_email"),
    status: text("status", { enum: FIX_STATUS }).notNull().default("pending"),
    appliedSnapshotId: text("applied_snapshot_id"),
    adminNote: text("admin_note").notNull().default(""),
    createdAt: createdAt(),
  },
  (t) => [index("fix_suggestions_project_idx").on(t.projectId)],
);

export const projectsRelations = relations(projects, ({ many }) => ({
  snapshots: many(snapshots),
  releases: many(releases),
  issues: many(issues),
  fixSuggestions: many(fixSuggestions),
}));

export const snapshotsRelations = relations(snapshots, ({ one }) => ({
  project: one(projects, { fields: [snapshots.projectId], references: [projects.id] }),
}));

export const releasesRelations = relations(releases, ({ one, many }) => ({
  project: one(projects, { fields: [releases.projectId], references: [projects.id] }),
  assets: many(releaseAssets),
}));

export const releaseAssetsRelations = relations(releaseAssets, ({ one }) => ({
  release: one(releases, { fields: [releaseAssets.releaseId], references: [releases.id] }),
}));

export const issuesRelations = relations(issues, ({ one }) => ({
  project: one(projects, { fields: [issues.projectId], references: [projects.id] }),
}));

export const fixSuggestionsRelations = relations(fixSuggestions, ({ one }) => ({
  project: one(projects, { fields: [fixSuggestions.projectId], references: [projects.id] }),
  issue: one(issues, { fields: [fixSuggestions.issueId], references: [issues.id] }),
}));

export type Project = typeof projects.$inferSelect;
export type Snapshot = typeof snapshots.$inferSelect;
export type Release = typeof releases.$inferSelect;
export type ReleaseAsset = typeof releaseAssets.$inferSelect;
export type Issue = typeof issues.$inferSelect;
export type FixSuggestion = typeof fixSuggestions.$inferSelect;
