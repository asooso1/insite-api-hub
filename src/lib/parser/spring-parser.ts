import { ApiField } from "../mock-db";

export interface ApiEndpoint {
    path: string;
    method: string;
    className: string;
    methodName: string;
    summary: string;
    requestBody?: string;
    responseType?: string;
}

export class SpringParser {
    /**
     * Java 파일 내용을 분석하여 API 정보를 추출합니다.
     */
    static parseController(content: string): ApiEndpoint[] {
        const endpoints: ApiEndpoint[] = [];

        // 1. 클래스 레벨 RequestMapping 찾기
        const classMappingMatch = content.match(/@RequestMapping\(\s*["']([^"']+)["']\s*\)/);
        const basePath = classMappingMatch ? classMappingMatch[1] : "";

        // 2. 컨트롤러 여부 확인
        if (!content.includes("@RestController") && !content.includes("@Controller")) {
            return [];
        }

        const classNameMatch = content.match(/class\s+(\w+)/);
        const className = classNameMatch ? classNameMatch[1] : "Unknown";

        // 3. 메소드 레벨 매핑 찾기 (GetMapping, PostMapping, RequestMapping 등)
        const mappingRegex = /@(Get|Post|Put|Delete|Request)Mapping\(([^)]+)\)\s*(?:@[\w\d]+\s*)*\s*(?:public|private|protected)?\s+([\w<>.,\s]+)\s+(\w+)\s*\(([^)]*)\)/g;

        let match;
        while ((match = mappingRegex.exec(content)) !== null) {
            const [, mappingType, mappingValue, returnType, methodName, params] = match;

            // 경로 추출
            const pathMatch = mappingValue.match(/["']([^"']+)["']/);
            const subPath = pathMatch ? pathMatch[1] : "";
            const fullPath = (basePath + (subPath.startsWith("/") ? "" : "/") + subPath).replace(/\/+/g, "/");

            // 메소드 결정
            let method = mappingType.toUpperCase();
            if (method === "REQUEST") {
                const methodAttr = mappingValue.match(/method\s*=\s*RequestMethod\.(\w+)/);
                method = methodAttr ? methodAttr[1] : "GET";
            }

            // RequestBody 추출
            const requestBodyMatch = params.match(/@RequestBody\s+([\w<>.]+)/);
            const requestBody = requestBodyMatch ? requestBodyMatch[1] : undefined;

            // Javadoc 또는 상단 주석에서 요약 정보 추출 (간단하게 구현)
            const lines = content.substring(0, match.index).split("\n");
            let summary = "";
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith("*") || line.startsWith("//")) {
                    summary = line.replace(/^\*+\s*/, "").replace(/^\/\/+\s*/, "").trim();
                    if (summary) break;
                }
                if (line.includes("}") || line.includes("{") || i < lines.length - 10) break;
            }

            endpoints.push({
                path: fullPath,
                method,
                className,
                methodName,
                summary: summary || methodName,
                requestBody,
                responseType: returnType.trim()
            });
        }

        return endpoints;
    }

    /**
     * VO/DTO 클래스 소스를 분석하여 필드 정보를 추출합니다.
     */
    static parseDtoFields(content: string): ApiField[] {
        const fields: ApiField[] = [];

        // 필드 추출 정규식 (어노테이션 포함)
        const fieldRegex = /((?:@[\w\d]+\s*)*)\s*(?:private|protected|public)?\s+([\w<>.,\s]+)\s+(\w+)\s*;/g;

        let match;
        while ((match = fieldRegex.exec(content)) !== null) {
            const [, annotations, type, name] = match;

            const isRequired = annotations.includes("@NotNull") ||
                annotations.includes("@NotEmpty") ||
                annotations.includes("@NotBlank") ||
                annotations.includes("required=true");

            // Javadoc 필드 설명 추출
            const lines = content.substring(0, match.index).split("\n");
            let description = "";
            for (let i = lines.length - 1; i >= 0; i--) {
                const line = lines[i].trim();
                if (line.startsWith("*") || line.startsWith("//")) {
                    description = line.replace(/^\*+\s*/, "").replace(/^\/\/+\s*/, "").trim();
                    if (description && !description.includes("@")) break;
                }
                if (line.includes("}") || line.includes("{") || i < lines.length - 5) break;
            }

            fields.push({
                name,
                type: type.trim(),
                description,
                isRequired,
                isComplex: this.isComplexType(type.trim())
            });
        }

        return fields;
    }

    /**
     * 복합 타입(DTO/VO) 여부를 판단합니다.
     */
    static isComplexType(type: string): boolean {
        const baseType = this.extractBaseType(type);
        const primitiveTypes = ["String", "int", "Long", "Integer", "Double", "float", "boolean", "Boolean", "Date", "LocalDateTime", "Object", "void"];
        return !primitiveTypes.includes(baseType);
    }

    /**
     * 제네릭 타입에서 핵심 타입을 추출합니다. (예: List<UserDTO> -> UserDTO)
     */
    static extractBaseType(type: string): string {
        const match = type.match(/<(.+)>/);
        if (match) {
            return this.extractBaseType(match[1].split(',')[0].trim());
        }
        return type.replace(/\[\]$/, "").trim();
    }
}
