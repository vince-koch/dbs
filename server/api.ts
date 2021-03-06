import express from "express";
import "express-async-errors";
import { ExpressApi } from "./ExpressApi";
import { CalculatorController } from "./CalculatorController";
import { DbController } from "./DbController";

const app = express();
app.use(express.json());       // to support JSON-encoded bodies
app.use(express.urlencoded()); // to support URL-encoded bodies

ExpressApi.registerEndpoints(app, new DbController(), "api");
ExpressApi.registerEndpoints(app, new CalculatorController(), "api");

// error handler middleware
app.use((err, req, res, next) => {
    if (err !== null) {
        console.error("Unahandled exception caught in api.ts >>> ", err)

        if (err.message === 'access denied') {
            res.status(403)
            res.json({ error: err.message })
            res.end()
        }
        else {
            res.status(500)
            res.json({ error: err.message })
            res.end()
            return
        }
    }

    next(err);
});

export const handler = app;