import prismadb from "@/lib/prismadb";

export async function getResumeAnalysisCount(userId: string): Promise<number> {
  const count = await prismadb.transformationHistory.count({
    where: {
      userId,
      action: "resume-analyze",
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });
  return count;
}

export async function incrementResumeAnalysis(userId: string, url: string) {
  await prismadb.transformationHistory.create({
    data: {
      userId,
      action: "resume-analyze",
      url,
      date: new Date(),
    },
  });
}

export async function getImageTransformCount(userId: string): Promise<number> {
  const count = await prismadb.transformationHistory.count({
    where: {
      userId,
      action: "image-transform",
      date: {
        gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
      },
    },
  });
  return count;
}

export async function incrementImageTransform(userId: string, url: string) {
  await prismadb.transformationHistory.create({
    data: {
      userId,
      action: "image-transform",
      url,
      date: new Date(),
    },
  });
}
