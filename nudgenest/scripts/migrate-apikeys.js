"use strict";
var __awaiter = (this && this.__awaiter) || function (thisArg, _arguments, P, generator) {
    function adopt(value) { return value instanceof P ? value : new P(function (resolve) { resolve(value); }); }
    return new (P || (P = Promise))(function (resolve, reject) {
        function fulfilled(value) { try { step(generator.next(value)); } catch (e) { reject(e); } }
        function rejected(value) { try { step(generator["throw"](value)); } catch (e) { reject(e); } }
        function step(result) { result.done ? resolve(result.value) : adopt(result.value).then(fulfilled, rejected); }
        step((generator = generator.apply(thisArg, _arguments || [])).next());
    });
};
var __importDefault = (this && this.__importDefault) || function (mod) {
    return (mod && mod.__esModule) ? mod : { "default": mod };
};
Object.defineProperty(exports, "__esModule", { value: true });
const client_1 = require("../generated/prisma/prisma/client");
const crypto_1 = __importDefault(require("crypto"));
const prisma = new client_1.PrismaClient();
function migrateApiKeys() {
    return __awaiter(this, void 0, void 0, function* () {
        const merchants = yield prisma.merchants.findMany({
            where: { apiKey: null },
        });
        console.log(`Found ${merchants.length} merchants without API keys`);
        for (const merchant of merchants) {
            const apiKey = crypto_1.default.randomBytes(32).toString('hex');
            yield prisma.merchants.update({
                where: { id: merchant.id },
                data: { apiKey },
            });
            console.log(`✓ Generated API key for ${merchant.email}: ${apiKey}`);
        }
        console.log('Migration complete!');
    });
}
migrateApiKeys()
    .catch((e) => {
    console.error(e);
    process.exit(1);
})
    .finally(() => __awaiter(void 0, void 0, void 0, function* () {
    yield prisma.$disconnect();
}));
