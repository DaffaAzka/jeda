import "server-only";

import { cache } from "react";
import { prisma } from "@/lib/prisma";

export const getSupportResources = cache(async () => {
  const resources = await prisma.supportResource.findMany({
    where: { isActive: true },
    orderBy: [{ type: "asc" }, { name: "asc" }],
  });

  return resources;
});

export type SupportResourceItem = Awaited<
  ReturnType<typeof getSupportResources>
>[number];
