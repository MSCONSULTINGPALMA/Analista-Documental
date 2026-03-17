export enum AnalysisStatus {
  IDLE = 'IDLE',
  ANALYZING = 'ANALYZING',
  COMPLETED = 'COMPLETED',
  ERROR = 'ERROR'
}

export interface AnalysisResult {
  juridical: string | null;
  form: string | null;
}

export interface FileUploadState {
  file: File | null;
  previewUrl: string | null;
  base64: string | null;
  mimeType: string | null;
}