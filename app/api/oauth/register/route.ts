import { type NextRequest, NextResponse } from "next/server";
import { env } from "@/config/env";
import aj from "@/lib/arcjet";
import { getLogger } from "@/lib/logger";
import { createAdminClient } from "@/lib/supabase/supabase";

const log = getLogger(["app", "api", "oauth-register"]);

const CORS_HEADERS = {
  "Access-Control-Allow-Origin": "*",
  "Access-Control-Allow-Methods": "POST, OPTIONS",
  "Access-Control-Allow-Headers": "Authorization, Content-Type, Accept",
};

function isValidRedirectUri(value: unknown): value is string {
  if (
    typeof value !== "string" ||
    value.length > 2048 ||
    /[\s\\]/.test(value)
  ) {
    return false;
  }
  try {
    const uri = new URL(value);
    if (uri.hash || value.includes("#") || uri.username || uri.password)
      return false;
    if (uri.protocol === "https:") return Boolean(uri.hostname);
    // Private-use schemes must be domain-based (RFC 8252 section 7.1).
    return /^[a-z][a-z0-9+-]*(?:\.[a-z0-9+-]+)+:$/.test(uri.protocol);
  } catch {
    return false;
  }
}

export async function OPTIONS() {
  return new Response(null, {
    status: 204,
    headers: CORS_HEADERS,
  });
}

/**
 * RFC 7591 Dynamic Client Registration endpoint for MCP clients.
 * Forwards to Supabase's public DCR endpoint or falls back to the Admin OAuth API.
 *
 * @see https://datatracker.ietf.org/doc/html/rfc7591
 */
export async function POST(req: NextRequest) {
  try {
    const decision = await aj.protect(req, { requested: 1 });
    if (decision.isDenied()) {
      return NextResponse.json(
        { error: "rate_limit_exceeded" },
        { status: 429, headers: CORS_HEADERS },
      );
    }
    if (decision.isErrored()) throw new Error("Rate limiter unavailable");
  } catch {
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  let body: Record<string, unknown>;

  try {
    body = await req.json();
    if (!body || typeof body !== "object" || Array.isArray(body)) {
      throw new Error("Expected an object");
    }
  } catch {
    return NextResponse.json(
      {
        error: "invalid_request",
        error_description: "Request body must be valid JSON",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const {
    redirect_uris,
    client_name,
    client_uri,
    grant_types,
    response_types,
    scope,
    token_endpoint_auth_method,
  } = body as {
    redirect_uris?: unknown;
    client_name?: unknown;
    client_uri?: unknown;
    grant_types?: unknown;
    response_types?: unknown;
    scope?: unknown;
    token_endpoint_auth_method?: unknown;
  };

  if (
    !Array.isArray(redirect_uris) ||
    redirect_uris.length === 0 ||
    redirect_uris.length > 10 ||
    !redirect_uris.every(isValidRedirectUri)
  ) {
    return NextResponse.json(
      {
        error: "invalid_redirect_uri",
        error_description:
          "The redirect_uris parameter is required and must contain at least one valid URI.",
      },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  if (
    (client_name !== undefined &&
      (typeof client_name !== "string" || client_name.length > 200)) ||
    (client_uri !== undefined &&
      (typeof client_uri !== "string" ||
        !isValidRedirectUri(client_uri) ||
        !client_uri.startsWith("https://"))) ||
    (grant_types !== undefined &&
      (!Array.isArray(grant_types) ||
        !grant_types.every((grant) =>
          ["authorization_code", "refresh_token"].includes(grant),
        ))) ||
    (response_types !== undefined &&
      (!Array.isArray(response_types) ||
        response_types.length !== 1 ||
        response_types[0] !== "code")) ||
    (scope !== undefined &&
      (typeof scope !== "string" || scope.length > 1000)) ||
    (token_endpoint_auth_method !== undefined &&
      !["none", "client_secret_basic", "client_secret_post"].includes(
        String(token_endpoint_auth_method),
      ))
  ) {
    return NextResponse.json(
      { error: "invalid_client_metadata" },
      { status: 400, headers: CORS_HEADERS },
    );
  }

  const name =
    typeof client_name === "string" && client_name.trim().length > 0
      ? client_name.trim()
      : "MCP Client";

  const supabaseUrl = env.NEXT_PUBLIC_SUPABASE_URL.replace(/\/+$/, "");

  const defaultScope = "openid email profile offline_access";
  const effectiveScope =
    typeof scope === "string" && scope.trim().length > 0
      ? Array.from(
          new Set([...scope.trim().split(/\s+/), "offline_access"]),
        ).join(" ")
      : defaultScope;

  const effectiveGrantTypes =
    Array.isArray(grant_types) && grant_types.length > 0
      ? Array.from(
          new Set([...grant_types, "authorization_code", "refresh_token"]),
        )
      : ["authorization_code", "refresh_token"];

  const upstreamPayload = {
    redirect_uris,
    client_name: name,
    client_uri,
    response_types: response_types ?? ["code"],
    token_endpoint_auth_method,
    scope: effectiveScope,
    grant_types: effectiveGrantTypes,
  };

  // 1. Attempt registration against Supabase's public DCR endpoint
  try {
    const upstreamRes = await fetch(
      `${supabaseUrl}/auth/v1/oauth/clients/register`,
      {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          apikey: env.NEXT_PUBLIC_SUPABASE_PUBLISHABLE_KEY,
        },
        body: JSON.stringify(upstreamPayload),
      },
    );

    if (upstreamRes.ok) {
      const data = await upstreamRes.json();
      log.info(
        "Client registered via public Supabase DCR endpoint: {clientId}",
        {
          clientId: data.client_id,
        },
      );
      return NextResponse.json(data, {
        status: 201,
        headers: {
          ...CORS_HEADERS,
          "Cache-Control": "no-store",
          Pragma: "no-cache",
        },
      });
    }

    if (![404, 405].includes(upstreamRes.status)) {
      return NextResponse.json(
        {
          error: "invalid_client_metadata",
          error_description: "Registration rejected by authorization server",
        },
        {
          status: upstreamRes.status === 429 ? 429 : 400,
          headers: CORS_HEADERS,
        },
      );
    }

    log.warn(
      "Public DCR endpoint returned status {status}; falling back to admin registration API",
      { status: upstreamRes.status },
    );
  } catch (upstreamErr) {
    log.warn("Public DCR endpoint fetch failed: {error}", {
      error:
        upstreamErr instanceof Error
          ? upstreamErr.message
          : String(upstreamErr),
    });
    return NextResponse.json(
      { error: "temporarily_unavailable" },
      { status: 503, headers: CORS_HEADERS },
    );
  }

  // 2. Fall back to Supabase Admin OAuth API
  try {
    const adminClient = createAdminClient();
    const { data, error } = await adminClient.auth.admin.oauth.createClient({
      client_name: name,
      client_uri: typeof client_uri === "string" ? client_uri : undefined,
      redirect_uris: redirect_uris as string[],
      grant_types: effectiveGrantTypes as [
        "authorization_code" | "refresh_token",
      ],
      response_types: Array.isArray(response_types)
        ? (response_types as ["code"])
        : ["code"],
      scope: effectiveScope,
      token_endpoint_auth_method:
        typeof token_endpoint_auth_method === "string"
          ? (token_endpoint_auth_method as
              | "none"
              | "client_secret_basic"
              | "client_secret_post")
          : undefined,
    });

    if (error || !data) {
      log.error("Failed to register OAuth client via admin API: {error}", {
        error: error?.message,
      });
      return NextResponse.json(
        {
          error: "invalid_client_metadata",
          error_description:
            error?.message || "Failed to register OAuth client",
        },
        { status: 400, headers: CORS_HEADERS },
      );
    }

    log.info("Client registered via Supabase Admin OAuth API: {clientId}", {
      clientId: data.client_id,
    });

    return NextResponse.json(data, {
      status: 201,
      headers: {
        ...CORS_HEADERS,
        "Cache-Control": "no-store",
        Pragma: "no-cache",
      },
    });
  } catch (adminErr) {
    log.error("Unexpected error in admin OAuth client registration: {error}", {
      error: adminErr instanceof Error ? adminErr.message : String(adminErr),
    });
    return NextResponse.json(
      {
        error: "server_error",
        error_description:
          "An unexpected error occurred during client registration",
      },
      { status: 500, headers: CORS_HEADERS },
    );
  }
}
