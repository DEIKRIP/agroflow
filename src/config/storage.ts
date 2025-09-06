// Tipos para el módulo de almacenamiento

export type BucketType = 'documents' | 'images' | 'media' | 'temp';

export interface FileMetadata {
  name: string;
  size: number;
  type: string;
  lastModified: number;
}

export interface ValidationResult {
  valid: boolean;
  error?: string;
}

export const BUCKETS: {
  DOCUMENTS: BucketType;
  IMAGES: BucketType;
  MEDIA: BucketType;
  TEMP: BucketType;
  [key: string]: BucketType;
};

export const ALLOWED_FILE_TYPES: Record<BucketType, string[]>;
export const MAX_FILE_SIZES: Record<BucketType, number>;

export function generateFilePath(
  bucket: BucketType,
  entityType: string,
  entityId: string,
  fileName: string
): string;

export function getFileMetadata(file: File): FileMetadata;

export function validateFile(
  file: File,
  bucket: BucketType
): ValidationResult;
