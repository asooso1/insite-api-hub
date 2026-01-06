import { ApiModel, ApiField } from "../mock-db";

export function generateTypeScriptType(model: ApiModel): string {
    if (!model || !model.fields) return "";

    let code = `export interface ${model.name} {\n`;

    model.fields.forEach((field: ApiField) => {
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
