import { groq } from "next-sanity";

export const bindersListQuery = groq`*[_type == "binder"] | order(_createdAt desc) {
  _id,
  name,
  rows,
  columns,
  sortOrder,
  collectedIds,
  slotCards,
  ownerId,
  isExample,
  _createdAt
}`;

export const exampleBindersQuery = groq`*[_type == "binder" && isExample == true] | order(_createdAt asc) {
  _id,
  name,
  rows,
  columns,
  sortOrder,
  collectedIds,
  slotCards,
  ownerId,
  isExample,
  _createdAt
}`;

export const bindersByOwnerIdQuery = groq`*[_type == "binder" && ownerId == $ownerId] | order(_createdAt desc) {
  _id,
  name,
  rows,
  columns,
  sortOrder,
  collectedIds,
  slotCards,
  ownerId,
  isExample,
  _createdAt
}`;

export const binderByIdQuery = groq`*[_type == "binder" && _id == $id][0] {
  _id,
  name,
  rows,
  columns,
  sortOrder,
  collectedIds,
  slotCards,
  ownerId,
  isExample
}`;

export const userByEmailQuery = groq`*[_type == "user" && email == $email][0] {
  _id,
  email,
  hashedPassword,
  name
}`;
