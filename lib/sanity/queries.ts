import { groq } from "next-sanity";

export const bindersListQuery = groq`*[_type == "binder"] | order(_createdAt desc) {
  _id,
  name,
  rows,
  columns,
  sortOrder,
  collectedIds,
  _createdAt
}`;

export const binderByIdQuery = groq`*[_type == "binder" && _id == $id][0] {
  _id,
  name,
  rows,
  columns,
  sortOrder,
  collectedIds
}`;
