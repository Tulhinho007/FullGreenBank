"use strict";
Object.defineProperty(exports, "__esModule", { value: true });
var client_1 = require("@prisma/client");
var p = new client_1.PrismaClient();
p.tip.findMany({ take: 2, orderBy: { createdAt: 'desc' } }).then(console.log).finally(function () { return p.$disconnect(); });
