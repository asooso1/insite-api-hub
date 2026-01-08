import fs from "fs";
import path from "path";
import { ApiEndpoint, ApiModel, EnvConfig, ApiTestCase, MockDB, ApiField } from "./api-types";
export type { ApiEndpoint, ApiModel, EnvConfig, ApiTestCase, MockDB, ApiField };

const DB_PATH = path.join(process.cwd(), "mock-db.json");

export const getMockDB = (): MockDB => {
    const initial: MockDB = {
        projects: [],
        endpoints: [],
        models: [],
        environments: {
            DEV: { baseUrl: "http://localhost:8080", token: "", doorayWebhookUrl: "" },
            STG: { baseUrl: "https://stg-api.example.com", token: "", doorayWebhookUrl: "" },
            PRD: { baseUrl: "https://api.example.com", token: "", doorayWebhookUrl: "" },
        },
        testCases: []
    };

    if (!fs.existsSync(DB_PATH)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(initial, null, 2));
        return initial;
    }

    const data = JSON.parse(fs.readFileSync(DB_PATH, "utf-8"));
    const merged = { ...initial, ...data };

    if (JSON.stringify(merged) !== JSON.stringify(data)) {
        fs.writeFileSync(DB_PATH, JSON.stringify(merged, null, 2));
    }

    return merged;
};

export const saveToMockDB = (data: Partial<MockDB>) => {
    const current = getMockDB();
    const updated = { ...current, ...data };
    fs.writeFileSync(DB_PATH, JSON.stringify(updated, null, 2));
};
