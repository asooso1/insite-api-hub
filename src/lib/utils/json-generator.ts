import { ApiModel, ApiField } from "../mock-db";

/**
 * ApiModel 정보를 바탕으로 예시 JSON 객체를 생성합니다.
 */
export function generateSampleJson(model: ApiModel | undefined, allModels: ApiModel[]): string {
    if (!model) return "{}";

    try {
        const sampleObj = constructObject(model.fields, allModels);
        return JSON.stringify(sampleObj, null, 2);
    } catch (err) {
        console.error("JSON 생성 실패:", err);
        return "{}";
    }
}

function constructObject(fields: ApiField[], allModels: ApiModel[]): Record<string, any> {
    const obj: Record<string, any> = {};

    fields.forEach(field => {
        obj[field.name] = getFieldValue(field, allModels);
    });

    return obj;
}

function getFieldValue(field: ApiField, allModels: ApiModel[]): any {
    // 1. 중첩된 필드(refFields)가 있는 경우
    if (field.refFields && field.refFields.length > 0) {
        return constructObject(field.refFields, allModels);
    }

    // 2. 다른 모델을 참조하는 경우 (타입 이름으로 모델 찾기)
    const refModel = allModels.find(m => m.name === field.type);
    if (refModel) {
        return constructObject(refModel.fields, allModels);
    }

    // 3. 기본 타입별 더미 데이터
    const type = field.type.toLowerCase();

    if (type.includes("string")) return "sample_text";
    if (type.includes("int") || type.includes("long") || type.includes("double") || type.includes("float")) return 0;
    if (type.includes("boolean")) return true;
    if (type.includes("date") || type.includes("time")) return new Date().toISOString();
    if (type.includes("list") || type.includes("set") || field.type.endsWith("[]")) {
        return [];
    }

    return null;
}
