# Pokemon Card Binder

Track your Pokemon cards in binders with configurable grid sizes (e.g. 3×3, 4×4, 5×5), sort order (National Dex, Alphabetical, Kanto), search by name to get page/row/column, and check off collected Pokemon. Built with Next.js, Tailwind, and Sanity.io.

## Setup

1. Copy `.env.example` to `.env.local`.
2. Create a project at [sanity.io](https://sanity.io) and set:
   - `NEXT_PUBLIC_SANITY_PROJECT_ID`
   - `NEXT_PUBLIC_SANITY_DATASET` (e.g. `production`)
3. For creating binders and toggling “collected” from the app, create an API token with write access at [sanity.io/manage](https://sanity.io/manage) and set `SANITY_API_WRITE_TOKEN` in `.env.local`.
4. Generate an auth secret (e.g. `npx auth secret`) and set `AUTH_SECRET` in `.env.local` for login/register.
5. Run the dev server and open `/studio` to configure Sanity Studio (same project/dataset). Add your app URL to CORS origins if you deploy.

**Example binder:** One binder can be marked as the shared “example” that everyone can view and edit (e.g. Pokedex 4×5). In Sanity Studio, open a binder document, set **Example binder** to `true`, and leave **Owner ID** empty. That binder will appear under “Example binder” on the home page for all users.

## Getting Started

First, run the development server:

```bash
npm run dev
# or
yarn dev
# or
pnpm dev
# or
bun dev
```

Open [http://localhost:3000](http://localhost:3000) with your browser to see the result.

You can start editing the page by modifying `app/page.tsx`. The page auto-updates as you edit the file.

This project uses [`next/font`](https://nextjs.org/docs/app/building-your-application/optimizing/fonts) to automatically optimize and load [Geist](https://vercel.com/font), a new font family for Vercel.

## Learn More

To learn more about Next.js, take a look at the following resources:

- [Next.js Documentation](https://nextjs.org/docs) - learn about Next.js features and API.
- [Learn Next.js](https://nextjs.org/learn) - an interactive Next.js tutorial.

You can check out [the Next.js GitHub repository](https://github.com/vercel/next.js) - your feedback and contributions are welcome!

## Deploy on Vercel

The easiest way to deploy your Next.js app is to use the [Vercel Platform](https://vercel.com/new?utm_medium=default-template&filter=next.js&utm_source=create-next-app&utm_campaign=create-next-app-readme) from the creators of Next.js.

Check out our [Next.js deployment documentation](https://nextjs.org/docs/app/building-your-application/deploying) for more details.
