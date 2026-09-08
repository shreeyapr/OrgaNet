import { PrismaBetterSqlite3 } from "@prisma/adapter-better-sqlite3";
import { PrismaClient } from "../app/generated/prisma/client";

const adapter = new PrismaBetterSqlite3({
  url: "file:./prisma/dev.db",
});

const prisma = new PrismaClient({
  adapter,
});

const conventionCentreSpaces = [
  // Pavilions
  "Pavilion",
  "Pavilion 1",
  "Pavilion 2",
  "Pavilion 3",
  "Pavilion 1+2",
  "Pavilion 2+3",
  "Show Managers Cabin 1 (Pav)",
  "Show Managers Cabin 2 (Pav)",
  "Show Managers Cabin 3 (Pav)",
  "Baggage Room",

  // Level 1
  "Executive Boardroom Suite 101",
  "Business Lounge 1",
  "Suite 102",
  "Suite 103",
  "Suite 104",
  "Suite 104 A",
  "Suite 104 B",
  "Suite 105",
  "Suite 105 A",
  "Suite 105 B",
  "Viewing Gallery",

  // Level 2
  "Executive Boardroom Suite 201",
  "Business Lounge 2",
  "Suite 202",
  "Suite 203",
  "Suite 204",
  "Suite 204 A",
  "Suite 204 B",
  "Suite 205",
  "Suite 205 A",
  "Suite 205 B",
  "Suite 206",
  "Suite 206 A",
  "Suite 206 B",
  "Suite 207",
  "Suite 207 A",
  "Suite 207 B",
  "Suite 207 C",
  "Suite 207 A + B",
  "Suite 207 B + C",
  "Suite 208",
  "Suite 208 A",
  "Suite 208 B",
  "Suite 208 C",
  "Suite 208 A + B",
  "Suite 208 B + C",

  // Jasmine Hall
  "Jasmine Hall",
  "Jasmine Hall 1 (50%)",
  "Jasmine Hall 2 (50%)",
  "Jasmine Hall (40%)",
  "Jasmine Hall (60%)",
  "Show Managers Cabin 1 (JH)",
  "Show Managers Cabin 2 (JH)",

  // Lotus Ballroom
  "Lotus Ballroom",
  "Lotus Ballroom 1",
  "Lotus Ballroom 2",
  "Lotus Ballroom 3",
  "Lotus Ballroom 1+2",
  "Lotus Ballroom 2+3",
  "Bridal Suite 1",
  "Bridal Suite 2",
  "Bridal Suite 3",
  "Executive Boardroom Suite 301",
  "Suite 401",
  "Suite 401 A",
  "Suite 401 B",

  // Other
  "Outdoor Catering",
  "The Terrace",
  "Registration Hall",

  // Concourse
  "Executive Boardroom 101 Concourse",
  "Business Lounge 1 Concourse",
  "Suite 102 Concourse",
  "Suite 103 Concourse",
  "Suite 104 Concourse",
  "Suite 105 A Concourse",
  "Suite 105 B Concourse",
  "Business Lounge 2 Concourse",
  "Suite 202 Concourse",
  "Suite 203 Concourse",
  "Executive Boardroom 201 Concourse",
  "Suite 204 Concourse",
  "Suite 205 A Concourse",
  "Suite 205 B Concourse",
  "Suite 206 A Concourse",
  "Suite 206 B Concourse",
  "Executive Boardroom 301 Concourse",
  "Suite 401 Concourse",
  "Level 1 Concourse",
  "Level 2 Concourse",
];

const businessCentreSpaces = [
  "6 Seat",
  "8 Seat",
  "Business Centre",
  "Managers Room",
  "Registration Hall",
];

async function main() {
  console.log("Starting VenueOps venue seed...");

  // --------------------------------------------------
  // Jio World Convention Centre
  // --------------------------------------------------

  const conventionCentre = await prisma.venue.upsert({
    where: {
      id: "jio-world-convention-centre",
    },

    update: {
      name: "Jio World Convention Centre",
      address: "Jio World Convention Centre",
      status: "ACTIVE",
    },

    create: {
      id: "jio-world-convention-centre",
      name: "Jio World Convention Centre",
      address: "Jio World Convention Centre",
      status: "ACTIVE",
      description:
        "Jio World Convention Centre venue and event spaces.",
    },
  });

  // --------------------------------------------------
  // Add Convention Centre spaces
  // --------------------------------------------------

  for (const spaceName of conventionCentreSpaces) {
    await prisma.space.upsert({
      where: {
        id: `jwc-${spaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,
      },

      update: {
        name: spaceName,
        status: "AVAILABLE",
        capacity: null,
      },

      create: {
        id: `jwc-${spaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,

        venueId: conventionCentre.id,

        name: spaceName,

        capacity: null,

        status: "AVAILABLE",

        description:
          `Space located at Jio World Convention Centre.`,
      },
    });
  }

  // --------------------------------------------------
  // Jio World Business Centre
  // --------------------------------------------------

  const businessCentre = await prisma.venue.upsert({
    where: {
      id: "jio-world-business-centre",
    },

    update: {
      name: "Jio World Business Centre",
      address: "Jio World Business Centre",
      status: "ACTIVE",
    },

    create: {
      id: "jio-world-business-centre",
      name: "Jio World Business Centre",
      address: "Jio World Business Centre",
      status: "ACTIVE",
      description:
        "Jio World Business Centre venue and meeting spaces.",
    },
  });

  // --------------------------------------------------
  // Add Business Centre spaces
  // --------------------------------------------------

  for (const spaceName of businessCentreSpaces) {
    await prisma.space.upsert({
      where: {
        id: `jwbc-${spaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,
      },

      update: {
        name: spaceName,
        status: "AVAILABLE",
        capacity: null,
      },

      create: {
        id: `jwbc-${spaceName
          .toLowerCase()
          .replace(/[^a-z0-9]+/g, "-")
          .replace(/^-|-$/g, "")}`,

        venueId: businessCentre.id,

        name: spaceName,

        capacity: null,

        status: "AVAILABLE",

        description:
          `Space located at Jio World Business Centre.`,
      },
    });
  }

  console.log("");
  console.log("Venue seed completed successfully.");
  console.log("");
  console.log(
    `Created/updated: ${conventionCentre.name}`
  );
  console.log(
    `Spaces: ${conventionCentreSpaces.length}`
  );
  console.log("");
  console.log(
    `Created/updated: ${businessCentre.name}`
  );
  console.log(
    `Spaces: ${businessCentreSpaces.length}`
  );
  console.log("");
}

main()
  .catch((error) => {
    console.error("Seed failed:", error);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });