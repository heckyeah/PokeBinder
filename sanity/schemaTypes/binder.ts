import { defineField, defineType } from "sanity";

export const binderType = defineType({
  name: "binder",
  title: "Binder",
  type: "document",
  fields: [
    defineField({
      name: "ownerId",
      title: "Owner ID",
      type: "string",
      description: "Sanity user _id; omitted for the shared example binder",
    }),
    defineField({
      name: "isExample",
      title: "Example binder",
      type: "boolean",
      initialValue: false,
      description: "When true, everyone can view and edit this binder",
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
      description: "Optional user-defined binder name",
    }),
    defineField({
      name: "rows",
      title: "Rows",
      type: "number",
      validation: (rule) => rule.required().min(1).max(10),
      description: "Number of rows per page (e.g. 3, 4, 5)",
    }),
    defineField({
      name: "columns",
      title: "Columns",
      type: "number",
      validation: (rule) => rule.required().min(1).max(10),
      description: "Number of columns per page (e.g. 3, 4, 5)",
    }),
    defineField({
      name: "sortOrder",
      title: "Sort order",
      type: "string",
      options: {
        list: [
          { title: "National Dex", value: "national" },
          { title: "Alphabetical", value: "alphabetical" },
          { title: "Kanto", value: "kanto" },
        ],
      },
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "collectedIds",
      title: "Collected Pokemon IDs",
      type: "array",
      of: [{ type: "number" }],
      description: "National Dex IDs that the user has checked off as owned",
      initialValue: [],
    }),
    defineField({
      name: "slotCards",
      title: "Slot card assignments",
      type: "array",
      of: [
        {
          type: "object",
          fields: [
            { name: "pokemonId", type: "number", title: "Pokemon ID" },
            { name: "tcgCardId", type: "string", title: "TCG card ID" },
            { name: "imageUrl", type: "string", title: "Card image URL" },
            { name: "language", type: "string", title: "Card language" },
          ],
        },
      ],
      description: "Maps binder slots (Pokemon ID) to chosen TCG card IDs",
      initialValue: [],
    }),
  ],
});
