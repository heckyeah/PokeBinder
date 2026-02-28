import { defineField, defineType } from "sanity";

export const userType = defineType({
  name: "user",
  title: "User",
  type: "document",
  fields: [
    defineField({
      name: "email",
      title: "Email",
      type: "string",
      validation: (rule) => rule.required(),
    }),
    defineField({
      name: "hashedPassword",
      title: "Hashed password",
      type: "string",
      validation: (rule) => rule.required(),
      hidden: true,
    }),
    defineField({
      name: "name",
      title: "Name",
      type: "string",
    }),
  ],
});
