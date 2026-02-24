import { defineField, defineType } from "sanity";

export const binderType = defineType({
  name: "binder",
  title: "Binder",
  type: "document",
  fields: [
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
  ],
});
