export interface StoredFile {
  id: string;
  original_filename: string;
  file_type: string;
  size: number;
  uploaded_at: string;
  file: string;
  // New deduplication fields
  is_duplicate: boolean;
  file_url: string;
  file_hash: string;
  message?: string;
  storage_saved?: number;
}

export interface StorageStats {
  total_files: number;
  unique_files: number;
  duplicate_files: number;
  total_size: number;
  actual_storage_used: number;
  storage_saved: number;
  savings_percentage: number;
}
