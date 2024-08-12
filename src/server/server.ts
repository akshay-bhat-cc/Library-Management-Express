import http from "node:http";
import AppError from "./appError";

type URLPath = string;
export type AllowedHTTPMethods = "GET" | "POST" | "PUT" | "PATCH" | "DELETE";
export interface CustomRequest extends http.IncomingMessage {
  [key: string]: any;
}
export type CustomResponse = http.ServerResponse;

export type NextMiddlewareExecutor = (error?: Error | AppError) => void;

export type Middleware = (
  request: CustomRequest,
  response: CustomResponse,
  next?: NextMiddlewareExecutor
) => void;

export class HTTPServer {
  private port: number;
  private server: ReturnType<typeof http.createServer>;
  private middlewareMap: Record<
    URLPath,
    Record<AllowedHTTPMethods, Middleware[]> | Middleware[]
  > = {};
  globalMiddleWares: Middleware[] = [];

  constructor(port: number) {
    this.port = port;

    this.server = http.createServer(
      (request: http.IncomingMessage, response: http.ServerResponse) => {
        const method = request.method as AllowedHTTPMethods;
        if (
          method !== "GET" &&
          method !== "POST" &&
          method !== "PUT" &&
          method !== "PATCH" &&
          method !== "DELETE"
        ) {
          response
            .writeHead(500)
            .end(`Sorry, currently not handling ${request.method}`);
          return;
        }
        this.handleRequest(
          request as CustomRequest,
          response as CustomResponse
        );
      }
    );

    this.server.listen(this.port, () => {
      console.log("listening at port: ", this.port);
    });
  }

  private async handleRequest(
    request: CustomRequest,
    response: CustomResponse
  ) {
    // Parse URL and search parameters
    const url = new URL(request.url ?? "", `http://${request.headers.host}`);
    const path = url.pathname;
    const method = request.method as AllowedHTTPMethods;

    console.dir(this.middlewareMap);

    this.executeMiddlewares(this.globalMiddleWares, request, response, 0);

    const pathSpecificMiddlewares: Middleware[] =
      this.getPathSpecifMiddlewares(path);

    const methodSpecificMiddlewares = this.getMethodSpecificMiddlewares(
      path,
      method
    );

    this.executeMiddlewares(pathSpecificMiddlewares, request, response, 0);
    this.executeMiddlewares(methodSpecificMiddlewares, request, response, 0);
  }

  public get(path: string, ...middlewares: Middleware[]) {
    this.use("GET", path, ...middlewares);
  }

  public post(path: string, ...middlewares: Middleware[]) {
    this.use("POST", path, ...middlewares);
  }

  public put(path: string, ...middlewares: Middleware[]) {
    this.use("PUT", path, ...middlewares);
  }

  public patch(path: string, ...middlewares: Middleware[]) {
    this.use("PATCH", path, ...middlewares);
  }

  public delete(path: string, ...middlewares: Middleware[]) {
    // this.middlewareMap["DELETE"][path] = middlewares;
    this.use("DELETE", path, ...middlewares);
  }

  public use(...middlewares: Middleware[]): void;
  public use(path: string, ...middlewares: Middleware[]): void;
  public use(
    method: AllowedHTTPMethods,
    path: string,
    ...middlewares: Middleware[]
  ): void;

  public use(
    methodOrPathOrMiddleware: AllowedHTTPMethods | string | Middleware,
    pathOrMiddleware: string | Middleware,
    ...middlewares: Middleware[]
  ): void {
    if (typeof methodOrPathOrMiddleware === "string") {
      if (typeof pathOrMiddleware === "string") {
        // Case 3: (method: AllowedHTTPMethods, path: string, ...middlewares: Middleware[])
        const method = methodOrPathOrMiddleware as AllowedHTTPMethods;
        const path = pathOrMiddleware as string;
        if (!this.middlewareMap[path]) {
          this.middlewareMap[path] = {} as Record<URLPath, Middleware[]>;
        }

        (this.middlewareMap[path] as Record<URLPath, Middleware[]>)[method] =
          middlewares;
      } else {
        // Case 2: (path: string, ...middlewares: Middleware[])
        const path = methodOrPathOrMiddleware as string;
        this.middlewareMap[path] = pathOrMiddleware
          ? [pathOrMiddleware as Middleware, ...middlewares]
          : [...middlewares];
      }
    } else {
      // Case 1: (...middlewares: Middleware[])
      this.globalMiddleWares.push(
        methodOrPathOrMiddleware as Middleware,
        ...middlewares
      );
    }
  }

  private nextFunctionCreator(
    request: CustomRequest,
    response: CustomResponse,
    middlewares: Middleware[],
    nextIndex: number
  ): NextMiddlewareExecutor {
    return (error?: Error | AppError) => {
      if (error instanceof AppError) {
        response
          .writeHead(error.status, { "Content-Type": "application/json" })
          .end(
            JSON.stringify({
              title: error.title,
              message: error.message,
              stack: error.stackTrace,
            })
          );
      } else {
        if (nextIndex < middlewares.length) {
          this.executeMiddlewares(middlewares, request, response, nextIndex);
        }
      }
    };
  }

  private executeMiddlewares(
    middlewares: Middleware[],
    request: CustomRequest,
    response: CustomResponse,
    nextIndex: number
  ) {
    const currentMiddleware = middlewares[nextIndex];
    if (currentMiddleware) {
      currentMiddleware(
        request,
        response,
        this.nextFunctionCreator(request, response, middlewares, nextIndex + 1)
      );
    }
  }
  private getMatchingPathKey(path: string): string[] | undefined {
    const pathKeys: string[] = [];
    Object.keys(this.middlewareMap).find((key) => {
      if (path.startsWith(key)) {
        pathKeys.push(key);
      }
    });
    return pathKeys;
  }

  private getPathSpecifMiddlewares(path: string): Middleware[] {
    const pathKeys = this.getMatchingPathKey(path);
    const pathSpecificMiddlewares: Middleware[] = [];
    pathKeys?.forEach((path) => {
      const middlewares = this.middlewareMap[path] as Middleware[];
      pathSpecificMiddlewares.push(...middlewares);
    });

    return pathSpecificMiddlewares;
  }

  private getMethodSpecificMiddlewares(
    path: string,
    method: AllowedHTTPMethods
  ): Middleware[] {
    return (
      this.middlewareMap[path] as Record<AllowedHTTPMethods, Middleware[]>
    )[method as AllowedHTTPMethods] as Middleware[];
  }
}
