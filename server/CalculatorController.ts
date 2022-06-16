import { http } from "./ExpressApi";

@http.controller("calculator")
export class CalculatorController {
    @http.get("add")
    public async add(
        @http.fromQuery("a", v => Number(v)) a: number,
        @http.fromQuery("b", v => Number(v)) b: number): Promise<number>
    {
        const result = a + b;
        return result;
    }
}