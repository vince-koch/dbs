import "reflect-metadata";
import { Application } from "express";
import Utilities from "./Utilities";

// https://saul-mirone.github.io/a-complete-guide-to-typescript-decorator/
// ----------|-----------------|----------------------------------------
// Decorator | Static/Instance | "Target" Parameter
// ----------|-----------------|----------------------------------------
// Class     |                 | constructor function of the class
// Property  | static          | constructor function of the class
//           | instance        | the prototype of the class
// Method    | static          | constructor function of the class
//           | instance        | the prototype of the class
// Parameter | static          | constructor function of the class
//           | instance        | the prototype of the class

type HttpParamInfo = {
    parameterIndex: number,
    from: "query" | "body",
    parameterName: string | null,
    converter: ((value: string | any) => any) | null
}

export class http {
    public static controller(url: string | null = null): ClassDecorator {
        return function (target: Function) {
            Reflect.defineMetadata("controller:route", url, target);
        }
    }

    public static get(url: string | null = null): MethodDecorator {
        return function (target: Object, methodName: string | symbol, descriptor: PropertyDescriptor) {
            Reflect.defineMetadata("controller:http-method", "get", target, methodName);
            Reflect.defineMetadata("controller:route", url, target, methodName);
        };
    }

    public static post(url: string | null = null): MethodDecorator {
        return function (target: Object, methodName: string | symbol, descriptor: PropertyDescriptor) {
            Reflect.defineMetadata("controller:http-method", "post", target, methodName);
            Reflect.defineMetadata("controller:route", url, target, methodName);
        };
    }

    public static fromQuery<T>(
        parameterName: string,
        converter: ((value: string) => any) | null = null): ParameterDecorator
    {
        if (converter == null || converter == undefined) {
            converter = (value: string) => value;
        }

        return function (target: Object, parameterKey: string | symbol, parameterIndex: number) {
            Reflect.defineMetadata("controller:from", "query", target, parameterKey);

            const paramInfo = Reflect.getMetadata("controller:param", target, parameterKey) as HttpParamInfo[] ?? [];
            paramInfo.push({ parameterName, parameterIndex, from: "query", converter });
            Reflect.defineMetadata("controller:param", paramInfo, target, parameterKey);
        };
    }

    public static fromBody<T>(
        parameterName: string | null = null,
        converter: ((value: any) => any) | null = null):  ParameterDecorator
    {
        if (converter == null || converter == undefined) {
            converter = (value: string) => value;
        }

        return function (target: Object, parameterKey: string | symbol, parameterIndex: number) {
            Reflect.defineMetadata("controller:from", "body", target, parameterKey);

            const paramInfo = Reflect.getMetadata("controller:param", target, parameterKey) as HttpParamInfo[] ?? [];
            paramInfo.push({ "parameterName": parameterName, parameterIndex, from: "body", converter });
            Reflect.defineMetadata("controller:param", paramInfo, target, parameterKey);
        };
    }
}

export class ExpressApi {
    public static registerEndpoints(app: Application, controller: any, prefix: string | null = "api"): void {
        const prototype = Utilities.reflection.getPrototype(controller);
        const constructor = Utilities.reflection.getConstructor(controller);
        const controllerRoute = Reflect.getOwnMetadata("controller:route", constructor);

        const methods = Utilities.reflection.getClassMethods(controller);
        for (let i = 0; i < methods.length; i++) {
            const method = methods[i];

            const httpMethod = Reflect.getOwnMetadata("controller:http-method", prototype, method.name)
                ?? ExpressApi.calculateHttpMethodFromName(method);
            const methodRoute = Reflect.getOwnMetadata("controller:route", prototype, method.name);
            const route = ExpressApi.calculateMethodRoute("/", prefix ?? "", controllerRoute, methodRoute);
            const parameters = Reflect.getOwnMetadata("controller:param", prototype, method.name) ?? [] as HttpParamInfo[];

            app[httpMethod](route, async (req, res) => {
                console.info(`[EXPRESS REQUEST] ${httpMethod.toUpperCase()} ${route} ===> ${constructor.name}.${method.name}`);

                // create an array for our parameters
                const maxArgs = Math.max(0, ...parameters.map(item => item.parameterIndex + 1));
                const args = new Array(maxArgs);

                // populate our parameter array
                parameters.forEach(parameterInfo => {
                    if (parameterInfo.from == "query" && parameterInfo.parameterName !== null) {
                        const value = req.params[parameterInfo.parameterName] ?? req.query[parameterInfo.parameterName];
                        const converted = parameterInfo.converter(value);
                        args[parameterInfo.parameterIndex] = converted;
                    }
                    else if (parameterInfo.from == "body") {
                        const value = parameterInfo.parameterName != null
                            ? req.body[parameterInfo.parameterName]
                            : req.body;

                        const converted = parameterInfo.converter(value);
                        args[parameterInfo.parameterIndex] = converted;
                    }
                });

                // invoke our method
                console.info(`[EXPRESS INVOKE] ${constructor.name}.${method.name}(${args})`);
                const result = await method.apply(controller, args);

                // shove our result into response
                res.json(result);
            });

            console.info(`[EXPRESS ENDPOINT] ${httpMethod.toUpperCase()} ${route} ===> ${prototype.constructor.name}.${method.name}`);
        }
    }

    private static calculateMethodRoute(...segments: string[]) {
        segments = segments.filter(item => item !== null && item !== undefined && item.length > 0);

        var lastIndex = Utilities.array.findLastIndex(segments, item => item.startsWith("/"));
        if (lastIndex > -1) {
            segments = segments.slice(lastIndex);
        }

        const route = segments.join("/").replace("//", "/");
        return route;
    }

    private static calculateHttpMethodFromName(method: Function): string {
        const methodName = method.name.toLowerCase();
        const httpVerbs = [ "get", "post", "put", "patch", "delete" ];
        const verb = httpVerbs.find(item => methodName.startsWith(item));

        if (verb === undefined) {
            throw new Error(`Unable to determine http verb for method [${method.name}]`)
        }

        return verb;
    }
}