import express from 'express';
import { type Server as HttpServer } from 'node:http';
export declare function createHttpServer(port: number): {
    app: express.Application;
    server: HttpServer;
    url: string;
};
