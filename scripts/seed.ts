const { PrismaClient } = require("@prisma/client");

const db = new PrismaClient();

async function main() {
  try {
    await db.category.createMany({
      data: [
        {
          name: "Famous People",
        },
        {
          name: "Sports",
        },
        {
          name: "God",
        },
        {
          name: "Musician",
        },
        {
          name: "Movies & TV",
        },

        {
          name: "Animals",
        },
        {
            name: "Scientists" 
         },
      ],
    });
  } catch (error) {
    console.error("Error seeding default categories", error);
  } finally {
    await db.$disconnect();
  }
}


main();