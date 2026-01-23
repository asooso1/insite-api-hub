import { ApiModel, ApiField } from './api-types';
import { v4 as uuidv4 } from 'uuid';

export interface PayloadGeneratorOptions {
  includeOptional?: boolean;  // 선택 필드 포함 여부
  maxDepth?: number;          // 최대 중첩 깊이 (기본 5)
  useSmartValues?: boolean;   // 필드명 기반 스마트 값 생성
}

const DEFAULT_OPTIONS: Required<PayloadGeneratorOptions> = {
  includeOptional: false,
  maxDepth: 5,
  useSmartValues: true,
};

/**
 * 필드명 기반 스마트 값 생성
 */
export function getSmartValue(fieldName: string, fieldType: string): any {
  const lowerName = fieldName.toLowerCase();

  // Email 패턴
  if (lowerName.includes('email')) {
    return 'user@example.com';
  }

  // Phone 패턴
  if (lowerName.includes('phone') || lowerName.includes('tel')) {
    return '010-1234-5678';
  }

  // Name 패턴
  if (lowerName.includes('name') && !lowerName.includes('username')) {
    return '홍길동';
  }

  if (lowerName.includes('username')) {
    return 'user123';
  }

  // Password 패턴
  if (lowerName.includes('password') || lowerName.includes('pwd')) {
    return 'Password123!';
  }

  // URL 패턴
  if (lowerName.includes('url') || lowerName.includes('link')) {
    return 'https://example.com';
  }

  // ID 패턴
  if ((lowerName === 'id' || lowerName.endsWith('id')) &&
      (fieldType.toLowerCase().includes('uuid') || fieldType.toLowerCase().includes('string'))) {
    return uuidv4();
  }

  // Count/Quantity 패턴
  if (lowerName.includes('count') || lowerName.includes('quantity') || lowerName.includes('qty')) {
    return Math.floor(Math.random() * 100) + 1;
  }

  // Price/Amount 패턴
  if (lowerName.includes('price') || lowerName.includes('amount') || lowerName.includes('cost')) {
    return 10000;
  }

  // Age 패턴
  if (lowerName.includes('age')) {
    return 25;
  }

  // Description 패턴
  if (lowerName.includes('description') || lowerName.includes('desc')) {
    return 'Sample description';
  }

  // Title 패턴
  if (lowerName.includes('title')) {
    return 'Sample Title';
  }

  // Status 패턴
  if (lowerName.includes('status')) {
    return 'ACTIVE';
  }

  // Code 패턴
  if (lowerName.includes('code')) {
    return 'CODE001';
  }

  // Address 패턴
  if (lowerName.includes('address')) {
    return '서울시 강남구 테헤란로 123';
  }

  // Date 관련 패턴
  if (lowerName.includes('date') || lowerName.includes('at')) {
    return new Date().toISOString();
  }

  return null;
}

/**
 * 타입에 따른 기본 샘플값 생성
 */
function getDefaultValueByType(fieldType: string): any {
  const lowerType = fieldType.toLowerCase();

  // Boolean
  if (lowerType === 'boolean' || lowerType === 'bool') {
    return true;
  }

  // Number types
  if (lowerType.includes('int') || lowerType.includes('long') ||
      lowerType.includes('number') || lowerType === 'double' || lowerType === 'float') {
    return 123;
  }

  // Date types
  if (lowerType.includes('date') || lowerType.includes('time') || lowerType.includes('instant')) {
    return new Date().toISOString();
  }

  // UUID
  if (lowerType.includes('uuid')) {
    return uuidv4();
  }

  // String (default)
  return 'sample_string';
}

/**
 * 배열 타입인지 확인
 */
function isArrayType(fieldType: string): boolean {
  return fieldType.includes('[]') ||
         fieldType.toLowerCase().startsWith('list<') ||
         fieldType.toLowerCase().startsWith('set<') ||
         fieldType.toLowerCase().startsWith('array<');
}

/**
 * 배열의 요소 타입 추출
 */
function extractElementType(fieldType: string): string {
  // [] 제거
  if (fieldType.includes('[]')) {
    return fieldType.replace('[]', '').trim();
  }

  // List<T>, Set<T>, Array<T> 형태에서 T 추출
  const match = fieldType.match(/<(.+)>/);
  if (match) {
    return match[1].trim();
  }

  return 'String';
}

/**
 * 참조 타입 찾기
 */
function findReferenceModel(
  fieldType: string,
  allModels: ApiModel[]
): ApiModel | null {
  // 배열 타입이면 요소 타입 추출
  const targetType = isArrayType(fieldType)
    ? extractElementType(fieldType)
    : fieldType;

  return allModels.find(m => m.name === targetType) || null;
}

/**
 * 단일 필드 값 생성
 */
export function generateFieldValue(
  field: ApiField,
  allModels: ApiModel[],
  options: PayloadGeneratorOptions = {},
  depth: number = 0
): any {
  const opts = { ...DEFAULT_OPTIONS, ...options };

  // Depth 제한 확인
  if (depth >= opts.maxDepth) {
    return null;
  }

  // 필수 필드가 아니고 includeOptional이 false면 건너뜀
  if (!field.isRequired && !opts.includeOptional) {
    return undefined;
  }

  // 배열 타입 처리
  if (isArrayType(field.type)) {
    const elementType = extractElementType(field.type);
    const refModel = findReferenceModel(elementType, allModels);

    if (refModel) {
      // 참조 모델의 배열
      return [generateSamplePayload(refModel, allModels, opts, depth + 1)];
    } else {
      // 기본 타입 배열
      const smartValue = opts.useSmartValues
        ? getSmartValue(field.name, elementType)
        : null;

      return [smartValue ?? getDefaultValueByType(elementType)];
    }
  }

  // 복합 타입 (refFields가 있는 경우)
  if (field.isComplex && field.refFields && field.refFields.length > 0) {
    const nestedObject: Record<string, any> = {};

    for (const refField of field.refFields) {
      const value = generateFieldValue(refField, allModels, opts, depth + 1);
      if (value !== undefined) {
        nestedObject[refField.name] = value;
      }
    }

    return nestedObject;
  }

  // 참조 타입 확인
  const refModel = findReferenceModel(field.type, allModels);
  if (refModel) {
    return generateSamplePayload(refModel, allModels, opts, depth + 1);
  }

  // 스마트 값 생성 시도
  if (opts.useSmartValues) {
    const smartValue = getSmartValue(field.name, field.type);
    if (smartValue !== null) {
      return smartValue;
    }
  }

  // 기본 타입별 값 생성
  return getDefaultValueByType(field.type);
}

/**
 * DTO 스키마 기반 샘플 payload 생성
 */
export function generateSamplePayload(
  model: ApiModel,
  allModels: ApiModel[],
  options: PayloadGeneratorOptions = {},
  depth: number = 0
): Record<string, any> {
  const opts = { ...DEFAULT_OPTIONS, ...options };
  const payload: Record<string, any> = {};

  // Depth 제한 확인
  if (depth >= opts.maxDepth) {
    return payload;
  }

  // 필드가 없으면 빈 객체 반환
  if (!model.fields || model.fields.length === 0) {
    return payload;
  }

  // 각 필드에 대해 값 생성
  for (const field of model.fields) {
    const value = generateFieldValue(field, allModels, opts, depth);

    // undefined가 아니면 payload에 추가
    if (value !== undefined) {
      payload[field.name] = value;
    }
  }

  return payload;
}

/**
 * JSON 문자열로 payload 생성 (포맷팅 포함)
 */
export function generateSamplePayloadJSON(
  model: ApiModel,
  allModels: ApiModel[],
  options: PayloadGeneratorOptions = {}
): string {
  const payload = generateSamplePayload(model, allModels, options);
  return JSON.stringify(payload, null, 2);
}
