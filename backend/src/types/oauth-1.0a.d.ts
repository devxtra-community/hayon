declare module "oauth-1.0a" {
    export default class OAuth {
        constructor(opts: any);
        authorize(request: any, token?: any): any;
        toHeader(data: any): any;
    }
}
