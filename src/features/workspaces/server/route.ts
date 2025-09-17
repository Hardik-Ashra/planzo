import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { createWorkspaceSchema, updateWorkspaceSchema } from "../schemas";
import { sessionMiddleware } from "@/lib/session-middleware";
import { DATABASE_ID, IMAGES_BUCKET_ID, MEMBERS_ID, TASKS_ID, WORKSPACES_ID } from "@/config";
import { ID, Query } from "node-appwrite";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { MemberRole } from "@/features/members/types";
import { generateInviteCode } from "@/lib/utils";
import { getMember } from "@/features/members/utilis";
import z from "zod";
import { Workspace } from "../type";
import { TaskStatus } from "@/features/tasks/types";

const app = new Hono()
    .get(
        "/",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const members = await databases.listDocuments(
                DATABASE_ID,
                MEMBERS_ID,
                [Query.equal("userId", user.$id)]
            );
            if (members.total === 0) {
                return c.json({ data: { documents: [], total: 0 } });
            }
            const workspaceIds = members.documents.map((member) => member.workspaceId);

            const workspaces = await databases.listDocuments(
                DATABASE_ID,
                WORKSPACES_ID,
                [
                    Query.orderDesc("$createdAt"),
                    Query.contains("$id", workspaceIds)
                ]
            );
            return c.json({ data: workspaces });
        })
    .get(
        "/:workspaceId",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");
            const { workspaceId } = c.req.param();
            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });
            if (!member) {
                return c.json({ error: "Unauthorized" }, 401)
            }
            const workspace = await databases.getDocument<Workspace>(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId
            )
            return c.json({ data: workspace });
        })
    .get(
        "/:workspaceId/info",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const { workspaceId } = c.req.param();
            const workspace = await databases.getDocument<Workspace>(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId
            )
            return c.json({
                data: {
                    $id: workspace.$id,
                    name: workspace.name,
                    imageUrl: workspace.imageUrl
                }
            });
        })
    .post(
        "/",
        zValidator("form", createWorkspaceSchema),
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const storage = c.get("storage");

            const { name, image } = c.req.valid("form");
            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                // 1. Upload the file
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image
                );
                uploadedImageUrl = `https://syd.cloud.appwrite.io/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`;

            }

            const workspace = await databases.createDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                ID.unique(),
                {
                    name,
                    userId: user.$id,
                    imageUrl: uploadedImageUrl,
                    inviteCode: generateInviteCode(6),
                }
            );
            await databases.createDocument(
                DATABASE_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    workspaceId: workspace.$id,
                    role: MemberRole.ADMIN,
                }
            );
            return c.json({ data: workspace });
        }
    )
    .patch(
        "/:workspaceId",
        sessionMiddleware,
        zValidator("form", updateWorkspaceSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { workspaceId } = c.req.param();
            const { name, image } = c.req.valid("form");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "You are not authorized to update this workspace" }, 401);
            }

            let uploadedImageUrl: string | undefined;

            if (image instanceof File) {
                const file = await storage.createFile(
                    IMAGES_BUCKET_ID,
                    ID.unique(),
                    image
                );
                uploadedImageUrl = `https://syd.cloud.appwrite.io/v1/storage/buckets/${IMAGES_BUCKET_ID}/files/${file.$id}/view?project=${process.env.NEXT_PUBLIC_APPWRITE_PROJECT}`;

            }
            else {
                uploadedImageUrl = image === "" ? undefined : image;
            }
            const workspace = await databases.updateDocument(
                DATABASE_ID,
                WORKSPACES_ID,
                workspaceId,
                {
                    name,
                    imageUrl: uploadedImageUrl,
                }
            );
            return c.json({ data: workspace });
        }
    )
    .delete(
        "/:workspaceId",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { workspaceId } = c.req.param();

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "You are not authorized to delete this workspace" }, 401);
            }

            //Todo:Delete members,projects and tasks

            await databases.deleteDocument(DATABASE_ID, WORKSPACES_ID, workspaceId);

            // Optionally delete the image if it exists
            if (member.imageUrl) {
                const fileId = member.imageUrl.split("/").pop()?.split("?")[0];
                if (fileId) {
                    await storage.deleteFile(IMAGES_BUCKET_ID, fileId);
                }
            }
            return c.json({ data: { $id: workspaceId } });
        }
    )
    .post(
        "/:workspaceId/reset-invite-code",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");

            const { workspaceId } = c.req.param();

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });

            if (!member || member.role !== MemberRole.ADMIN) {
                return c.json({ error: "You are not authorized to delete this workspace" }, 401);
            }
            const workspace = await databases.updateDocument(DATABASE_ID, WORKSPACES_ID, workspaceId,
                {
                    inviteCode: generateInviteCode(6),
                }
            );
            return c.json({ data: workspace });
        }
    )
    .post(
        "/:workspaceId/join",
        sessionMiddleware,
        zValidator("json", z.object({ code: z.string() })),
        async (c) => {
            const { workspaceId } = c.req.param();
            const { code } = c.req.valid("json");

            const databases = c.get("databases");
            const user = c.get("user");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });

            if (member) {
                return c.json({ error: "You are already a member of this workspace" }, 400);
            }

            const workspace = await databases.getDocument<Workspace>(DATABASE_ID, WORKSPACES_ID, workspaceId);

            if (workspace.inviteCode !== code) {
                return c.json({ error: "Invalid invite code" }, 400);
            };

            await databases.createDocument(
                DATABASE_ID,
                MEMBERS_ID,
                ID.unique(),
                {
                    userId: user.$id,
                    workspaceId: workspace.$id,
                    role: MemberRole.MEMBER,
                }
            );

            return c.json({ data: workspace });
        }
    )
    .get("/:workspaceId/analytics",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user")
            const databases = c.get("databases");
            const { workspaceId } = c.req.param();

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            });
            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }
    
            const now = new Date();
            const thisMonthStart = startOfMonth(now);
            const thisMonthEnd = endOfMonth(now);
            const lastMonthStart = startOfMonth(subMonths(now, 1));
            const lastMonthEnd = endOfMonth(subMonths(now, 1));
    
            // ✅ Helper to count tasks
            const countTasks = async (filters: string[]) => {
                const res = await databases.listDocuments(DATABASE_ID, TASKS_ID, filters);
                return res.total;
            };
    
            // ---- All tasks
            const thisMonthTasks = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
            ]);
            const lastMonthTasks = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
            ]);
            const taskDifference = thisMonthTasks - lastMonthTasks;
    
            // ---- Assigned tasks
            const thisMonthAssigned = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.equal("assigneeId", user.$id), // ✅ safer than member.$id
                Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
            ]);
            const lastMonthAssigned = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.equal("assigneeId", user.$id),
                Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
            ]);
            const assigneeTaskDifference = thisMonthAssigned - lastMonthAssigned;
    
            // ---- Incomplete tasks
            const thisMonthIncomplete = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
            ]);
            const lastMonthIncomplete = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
            ]);
            const incompleteTaskDifference = thisMonthIncomplete - lastMonthIncomplete;
    
            // ---- Completed tasks
            const thisMonthCompleted = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.equal("status", TaskStatus.DONE),
                Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
            ]);
            const lastMonthCompleted = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.equal("status", TaskStatus.DONE),
                Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
            ]);
            const completedTaskDifference = thisMonthCompleted - lastMonthCompleted;
    
            // ---- Overdue tasks
            const thisMonthOverdue = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.lessThan("dueDate", now.toISOString()),
                Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
            ]);
            const lastMonthOverdue = await countTasks([
                Query.equal("workspaceId", workspaceId),
                Query.notEqual("status", TaskStatus.DONE),
                Query.lessThan("dueDate", now.toISOString()),
                Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
            ]);
            const overdueTaskDifference = thisMonthOverdue - lastMonthOverdue;
    
            return c.json({
                data: {
                    taskCount: thisMonthTasks,
                    taskDifference,
                    assigneeTaskCount: thisMonthAssigned,
                    assigneeTaskDifference,
                    completedTaskCount: thisMonthCompleted,
                    completedTaskDifference,
                    incompleteTaskCount: thisMonthIncomplete,
                    incompleteTaskDifference,
                    overdueTaskCount: thisMonthOverdue,
                    overdueTaskDifference
                }
            });
        }
    );
export default app;
