import { DATABASE_ID, IMAGES_BUCKET_ID, PROJECTS_ID, TASKS_ID } from "@/config";
import { getMember } from "@/features/members/utilis";
import { sessionMiddleware } from "@/lib/session-middleware";
import { zValidator } from "@hono/zod-validator";
import { Hono } from "hono";
import { ID, Query } from "node-appwrite";
import z from "zod";
import { createProjectSchema, updateProjectSchema } from "../schemas";
import { Project } from "../type";
import { endOfMonth, startOfMonth, subMonths } from "date-fns";
import { TaskStatus } from "@/features/tasks/types";

const app = new Hono()
    .get("/",
        sessionMiddleware,
        zValidator("query", z.object({ workspaceId: z.string() })),
        async (c) => {
            const user = c.get("user");
            const databases = c.get("databases");

            const { workspaceId } = c.req.valid("query");
            if (!workspaceId) {
                return c.json({ error: "Missing workspaceId" }, 400)
            }
            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            })

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

            const projects = await databases.listDocuments<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                [
                    Query.equal("workspaceId", workspaceId),
                    Query.orderDesc("$createdAt"),
                ]
            )

            return c.json({ data: projects });
        }
    )
    .get(
        "/:projectId",
        sessionMiddleware,
        async (c) => {
            const user = c.get("user")
            const databases = c.get("databases");
            const { projectId } = c.req.param();
            const project = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                projectId
            );

            const member = await getMember({
                databases,
                workspaceId: project.workspaceId,
                userId: user.$id
            })
            if (!member) {
                return c.json({ error: "Unauthorized" }, 401)
            }
            return c.json({ data: project })
        }
    )
    .post("/",
        sessionMiddleware,
        zValidator("form", createProjectSchema),
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");
            const storage = c.get("storage");

            const { name, image, workspaceId } = c.req.valid("form");

            const member = await getMember({
                databases,
                workspaceId,
                userId: user.$id
            })

            if (!member) {
                return c.json({ error: "Unauthorized" }, 401);
            }

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

            const project = await databases.createDocument(
                DATABASE_ID,
                PROJECTS_ID,
                ID.unique(),
                {
                    name,
                    imageUrl: uploadedImageUrl,
                    workspaceId
                }
            );

            return c.json({ data: project });
        }
    )
    .patch(
        "/:projectId",
        sessionMiddleware,
        zValidator("form", updateProjectSchema),
        async (c) => {
            const databases = c.get("databases");
            const storage = c.get("storage");
            const user = c.get("user");

            const { projectId } = c.req.param();
            const { name, image } = c.req.valid("form");

            const existingProject = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                projectId
            )
            const member = await getMember({
                databases,
                workspaceId: existingProject.workspaceId,
                userId: user.$id
            });

            if (!member) {
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
            const project = await databases.updateDocument(
                DATABASE_ID,
                PROJECTS_ID,
                projectId,
                {
                    name,
                    imageUrl: uploadedImageUrl,
                }
            );
            return c.json({ data: project });
        }
    )
    .delete(
        "/:projectId",
        sessionMiddleware,
        async (c) => {
            const databases = c.get("databases");
            const user = c.get("user");

            const { projectId } = c.req.param();

            const existingProject = await databases.getDocument<Project>(
                DATABASE_ID,
                PROJECTS_ID,
                projectId
            )
            const member = await getMember({
                databases,
                workspaceId: existingProject.workspaceId,
                userId: user.$id
            });

            if (!member) {
                return c.json({ error: "You are not authorized to delete this workspace" }, 401);
            }

            //Todo:Delete tasks

            await databases.deleteDocument(DATABASE_ID, PROJECTS_ID, projectId);


            return c.json({ data: { $id: existingProject.$id } });
        }
    )
.get("/:projectId/analytics",
    sessionMiddleware,
    async (c) => {
        const user = c.get("user")
        const databases = c.get("databases");
        const { projectId } = c.req.param();

        // ✅ Ensure project exists
        const project = await databases.getDocument<Project>(
            DATABASE_ID,
            PROJECTS_ID,
            projectId
        );

        // ✅ Check workspace membership
        const member = await getMember({
            databases,
            workspaceId: project.workspaceId,
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
            Query.equal("projectId", projectId),
            Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
        ]);
        const lastMonthTasks = await countTasks([
            Query.equal("projectId", projectId),
            Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
        ]);
        const taskDifference = thisMonthTasks - lastMonthTasks;

        // ---- Assigned tasks
        const thisMonthAssigned = await countTasks([
            Query.equal("projectId", projectId),
            Query.equal("assigneeId", user.$id), // ✅ safer than member.$id
            Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
        ]);
        const lastMonthAssigned = await countTasks([
            Query.equal("projectId", projectId),
            Query.equal("assigneeId", user.$id),
            Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
        ]);
        const assigneeTaskDifference = thisMonthAssigned - lastMonthAssigned;

        // ---- Incomplete tasks
        const thisMonthIncomplete = await countTasks([
            Query.equal("projectId", projectId),
            Query.notEqual("status", TaskStatus.DONE),
            Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
        ]);
        const lastMonthIncomplete = await countTasks([
            Query.equal("projectId", projectId),
            Query.notEqual("status", TaskStatus.DONE),
            Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
        ]);
        const incompleteTaskDifference = thisMonthIncomplete - lastMonthIncomplete;

        // ---- Completed tasks
        const thisMonthCompleted = await countTasks([
            Query.equal("projectId", projectId),
            Query.equal("status", TaskStatus.DONE),
            Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
        ]);
        const lastMonthCompleted = await countTasks([
            Query.equal("projectId", projectId),
            Query.equal("status", TaskStatus.DONE),
            Query.between("$createdAt", lastMonthStart.toISOString(), lastMonthEnd.toISOString())
        ]);
        const completedTaskDifference = thisMonthCompleted - lastMonthCompleted;

        // ---- Overdue tasks
        const thisMonthOverdue = await countTasks([
            Query.equal("projectId", projectId),
            Query.notEqual("status", TaskStatus.DONE),
            Query.lessThan("dueDate", now.toISOString()),
            Query.between("$createdAt", thisMonthStart.toISOString(), thisMonthEnd.toISOString())
        ]);
        const lastMonthOverdue = await countTasks([
            Query.equal("projectId", projectId),
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
