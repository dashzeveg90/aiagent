import type { NextApiRequest, NextApiResponse } from "next";
import { createServerClient } from "@supabase/auth-helpers-nextjs";
import { serialize } from "cookie";

import { supabaseAdmin } from "@/lib/supabase";
import { normalizeOrgSystemPrompt } from "@/lib/rag/prompt";

export interface ChatOrganization {
  id: string;
  system_prompt: string;
  pinecone_namespace: string | null;
}

function createRequestSupabaseClient(
  req: NextApiRequest,
  res: NextApiResponse,
) {
  const appendCookies = (
    cookies: Array<{ name: string; value: string; options?: Parameters<typeof serialize>[2] }>,
  ) => {
    const existing = res.getHeader("Set-Cookie");
    const serialized = cookies.map(({ name, value, options }) =>
      serialize(name, value, {
        path: "/",
        ...options,
      }),
    );

    if (!existing) {
      res.setHeader("Set-Cookie", serialized);
      return;
    }

    const current = Array.isArray(existing) ? existing : [String(existing)];
    res.setHeader("Set-Cookie", [...current, ...serialized]);
  };

  return createServerClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!,
    {
      cookies: {
        getAll() {
          return Object.entries(req.cookies)
            .filter((entry): entry is [string, string] => typeof entry[1] === "string")
            .map(([name, value]) => ({
              name,
              value,
            }));
        },
        setAll(cookies) {
          appendCookies(cookies);
        },
      },
    },
  );
}

export async function getAuthenticatedChatOrganization(
  req: NextApiRequest,
  res: NextApiResponse,
): Promise<ChatOrganization | null> {
  const supabase = createRequestSupabaseClient(req, res);
  const {
    data: { user },
    error: userError,
  } = await supabase.auth.getUser();

  if (userError || !user) {
    return null;
  }

  const { data: org, error: orgError } = await supabaseAdmin
    .from("organizations")
    .select("id, system_prompt, pinecone_namespace")
    .eq("owner_id", user.id)
    .maybeSingle();

  if (orgError || !org) {
    return null;
  }

  return {
    id: org.id,
    system_prompt: normalizeOrgSystemPrompt(org.system_prompt),
    pinecone_namespace: org.pinecone_namespace?.trim() || null,
  };
}
