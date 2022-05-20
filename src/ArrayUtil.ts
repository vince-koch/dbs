export default class ArrayUtil {
    public static distinct<TItem>(array: TItem[]): TItem[] {
        function onlyUnique(value: TItem, index: number, self: TItem[]) {
            return self.indexOf(value) === index;
        }

        const result = array.filter(onlyUnique);

        return result;
    }

    public static groupBy<TItem>(
        array: TItem[],
        ...selectors: ((item: TItem) => any)[]): ArrayGroup<TItem>
    {
        const result = array.reduce(
            (storage, item) => {
                // should be some unique delimiter that wont appear in your keys
                const groupKey = selectors.map(selector => selector(item)).join(":");

                if (storage[groupKey]) {
                    storage[groupKey].push(item);
                }
                else {
                    storage[groupKey] = [item];
                }

                return storage;
            },
            {} as ArrayGroup<TItem>);

        return result;
    }

    public static orderBy<TItem>(
        array: TItem[],
        ...selectors: ((item: TItem) => any)[]): TItem[]
    {
        const result = array.sort(
            (a: TItem, b: TItem) =>
            {
                for (let i = 0; i < selectors.length; i++) {
                    const selector = selectors[i];
                    const aa = selector(a);
                    const bb = selector(b);

                    if (aa > bb) {
                        return 1;
                    }
                    else if (aa < bb) {
                        return -1;
                    }
                }

                return 0;
            });

        return result;
    }
}

export type ArrayGroup<TItem> = {
    [groupKey: string]: TItem[];
}

///////////////////////////////////////////
// extending Array

/*
declare global {
    interface Array<TItem> {
        distinct(): TItem[];

        groupBy(...selectors: ((item: TItem) => any)[]): ArrayGroup<TItem>;

        orderBy(...selectors: ((item: TItem) => any)[]): TItem[];
    }
}
*/

if (!Array.prototype.distinct) {
    Array.prototype.distinct = function <TItem>(): TItem[] {
        const result = ArrayUtil.distinct<TItem>(this);
        return result;
    }
}

if (!Array.prototype.groupBy) {
    Array.prototype.groupBy = function <TItem>(...selectors: ((item: TItem) => any)[]): ArrayGroup<TItem> {
        const result = ArrayUtil.groupBy(this, ...selectors);
        return result;
    }
}

if (!Array.prototype.orderBy) {
    Array.prototype.orderBy = function <TItem>(...selectors: ((item: TItem) => any)[]): TItem[] {
        const result = ArrayUtil.orderBy(this, ...selectors);
        return result;
    }
}