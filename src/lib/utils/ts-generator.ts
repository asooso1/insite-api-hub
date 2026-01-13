import { ApiModel, ApiField } from "../mock-db";

export function generateTypeScriptType(model: ApiModel): string {
    if (!model || !model.fields) return "";

    let code = `export interface ${model.name} {\n`;

    model.fields.forEach((field: ApiField) => {
        // 필터링: 자바 파싱 과정에서 잘못 포함될 수 있는 예약어/특수 키워드 제외
        const invalidNames = ['return', 'this', 'null', 'void', 'undefined'];
        if (invalidNames.includes(field.name.toLowerCase())) return;

        const isOptional = !field.isRequired;
        const type = mapJavaTypeToTS(field.type);

        if (field.description) {
            code += `  /** ${field.description} */\n`;
        }
        code += `  ${field.name}${isOptional ? "?" : ""}: ${type};\n`;
    });

    code += `}\n`;
    return code;
}

function mapJavaTypeToTS(javaType: string): string {
    const t = javaType.toLowerCase();
    if (t === "string") return "string";
    if (["int", "long", "double", "float", "integer", "number"].includes(t)) return "number";
    if (["boolean"].includes(t)) return "boolean";
    if (t === "date" || t === "localdatetime") return "string";
    if (t.includes("<") && t.includes(">")) {
        const inner = t.match(/<(.+)>/);
        if (inner) return `Array<${mapJavaTypeToTS(inner[1])}>`;
    }
    if (t.endsWith("[]")) return `Array<${mapJavaTypeToTS(t.replace("[]", ""))}>`;

    return javaType;
}
