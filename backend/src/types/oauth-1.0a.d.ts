declare module "oauth-1.0a" {
  interface OAuthOptions {
    consumer: { key: string; secret: string };
    signature_method?: string;
    hash_function?: (base_string: string, key: string) => string;
  }

  interface RequestOptions {
    url: string;
    method: string;
    data?: Record<string, unknown>;
  }

  interface AuthorizedRequest {
    oauth_consumer_key?: string;
    oauth_nonce?: string;
    oauth_signature?: string;
    oauth_signature_method?: string;
    oauth_timestamp?: string;
    oauth_token?: string;
    oauth_version?: string;
    [key: string]: unknown;
  }

  interface Header {
    Authorization: string;
  }

  export default class OAuth {
    constructor(opts: OAuthOptions);
    authorize(request: RequestOptions, token?: { key: string; secret: string }): AuthorizedRequest;
    toHeader(data: AuthorizedRequest): Header;
  }
}
