export class ArrayUtil {
    public static findLastIndex<TItem>(array: TItem[], predicate: (item: TItem) => boolean) {
        for (let i = array.length - 1; i >= 0; i--) {
            if (predicate(array[i])) {
                return i;
            }
        }

        return -1;
    }
}

export class ReflectionUtil {
    public static getPrototype(target: any): any {
        switch (typeof target) {
            case "object":
                return Object.getPrototypeOf(target);

            case "function":
                return target.prototype;

            default:
                throw new Error(`ReflectionUtil.getPrototype() encountered unexpected type [${typeof target}]`);
        }
    }

    public static getConstructor(target: any): any {
        switch (typeof target) {
            case "object":
                return Object.getPrototypeOf(target).constructor;

            case "function":
                return target;

            default:
                throw new Error(`ReflectionUtil.getConstructor() encountered unexpected type [${typeof target}]`);
        }
    }

    public static getClassMethods(target: any): Function[] {
        const prototype = ReflectionUtil.getPrototype(target);

        const methods = Reflect.ownKeys(prototype)
            .filter(key => key !== "constructor")
            .map(key => Reflect.get(prototype, key))
            .filter(item => typeof item === "function");

        return methods;
    }
}

export class StringUtil {
    public static isNullOrEmpty(value: string): boolean {
        return value == null || value == undefined || value.length === 0;
    }

    public static isNullOrWhiteSpace(value: string): boolean {
        return value == null || value == undefined || value.trim().length === 0;
    }
}

export default class Utilities {
    public static array = ArrayUtil;
    public static reflection = ReflectionUtil;
    public static string = StringUtil;
}