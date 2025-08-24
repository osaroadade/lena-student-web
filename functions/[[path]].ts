// @ts-nocheck
import { createRequestHandler } from "@react-router/cloudflare";

export const onRequest = async (context) => {
    const handleRequest = createRequestHandler(
        () => import("../build/server/index.js")
    );
    return handleRequest(context.request);
};