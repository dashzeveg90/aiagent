# AGENTS.md

## Overview

This repository is a small single-app Next.js project for a retrieval-augmented chatbot product with an admin dashboard.

- Framework: Next.js 16 using the Pages Router
- Language: TypeScript + React 19
- Styling: Tailwind CSS v4 with global CSS in `src/styles/globals.css`
- Auth and relational data: Supabase
- LLM and embeddings: OpenAI
- Vector storage: Pinecone

The product has two main surfaces:

1. A public chatbot UI on `/`
2. An authenticated admin dashboard on `/auth` and `/dashboard`

## Important Paths

- `src/pages/index.tsx` - homepage that mounts the chatbot
- `src/components/Chatbot.tsx` - client chat UI and SSE handling
- `src/pages/api/chat.ts` - chat API, retrieval, and streamed model response
- `src/pages/auth/index.tsx` - login and signup UI
- `src/pages/dashboard/index.tsx` - admin dashboard for org settings and documents
- `src/pages/api/upload.ts` - document upload, chunking, embeddings, and Pinecone upsert
- `src/lib/supabase.ts` - Supabase browser and admin clients
- `src/lib/openai.ts` - shared OpenAI client helper, currently unused

## Runtime Flow

### Public Chat

- The chatbot starts on `src/pages/index.tsx`.
- `src/components/Chatbot.tsx` stores local message history in the browser.
- On send, it POSTs `{ messages }` to `/api/chat`.
- The client expects server-sent events in the form `data: {"text": "..."}` and stops on `data: [DONE]`.

### Chat API

- `src/pages/api/chat.ts` embeds the latest question with OpenAI.
- It queries Pinecone for relevant context.
- It builds a strict system prompt that tells the model to answer only from retrieved context.
- It streams the completion back to the client.

### Auth and Dashboard

- `src/pages/auth/index.tsx` uses Supabase email/password auth.
- Signup also inserts an `organizations` row from the client.
- `src/pages/dashboard/index.tsx` fetches the current user, loads or creates an organization, then loads documents and recent logs.
- The dashboard lets the user edit `system_prompt`, upload documents, and sign out.

### Document Ingestion

- `src/pages/api/upload.ts` accepts multipart form uploads.
- It expects `file`, `orgId`, and `namespace`.
- It extracts text, splits it into chunks, creates embeddings, writes vectors to Pinecone, and records the upload in Supabase.

## Inferred Data Model

There is no checked-in schema or migration history, so the database contract is inferred from usage.

Likely tables:

- `organizations`
  - referenced fields include `id`, `owner_id`, `name`, `system_prompt`, `pinecone_namespace`, `verify_token`, `plan`
- `documents`
  - referenced fields include `id`, `org_id`, `filename`, `chunk_count`, `uploaded_at`
- `message_logs`
  - referenced fields include at least `org_id` and `created_at`

## Environment Variables

The code expects these environment variables:

- `NEXT_PUBLIC_SUPABASE_URL`
- `NEXT_PUBLIC_SUPABASE_ANON_KEY`
- `SUPABASE_SERVICE_KEY`
- `OPENAI_API_KEY`
- `PINECONE_API_KEY`
- `PINECONE_INDEX`

There is no committed `.env.example`, and `README.md` is still mostly the default Next.js template.

## Known Gaps And Caveats

These are important if you are modifying the codebase:

- `src/pages/dashboard/index.tsx` calls `/api/delete-doc`, but that API route does not exist.
- The dashboard also references `/api/messenger`, but that route does not exist.
- `message_logs` are read by the dashboard, but nothing in the repo writes to that table.
- The upload UI accepts `.docx` and `.pdf`, but the server-side extraction logic appears to only handle DOCX.
- Upload processing shells out to `python3` and assumes extra runtime dependencies are installed.
- `src/pages/api/chat.ts` queries Pinecone without namespace scoping, while uploads write into a namespace. Treat multi-tenant retrieval behavior carefully.
- `src/pages/api/upload.ts` trusts client-supplied `orgId` and `namespace`; verify auth and ownership before expanding this endpoint.

## Working Conventions For Future Agents

- Prefer preserving the current Pages Router structure unless the task explicitly asks for larger framework changes.
- Check dashboard and API interactions together before changing data contracts.
- Be careful with Supabase writes because schema and RLS rules are not present in the repo.
- Be careful with Pinecone namespace handling; chat and upload are not fully aligned.
- If you touch uploads, verify host/runtime assumptions like `/tmp`, `python3`, and document parsing dependencies.
- If you add features, consider also updating `README.md` or adding an env/setup document because current project docs are minimal.
