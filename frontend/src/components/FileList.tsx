import React, { useState } from 'react';
import { fileService } from '../services/fileService';
import { StoredFile, StorageStats } from '../types/file';
import { DocumentIcon, TrashIcon, ArrowDownTrayIcon } from '@heroicons/react/24/outline';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { SearchFilters, FilterState } from './SearchFilters';

export const FileList: React.FC = () => {
  const queryClient = useQueryClient();
  
  // Filter state
  const [filters, setFilters] = useState<FilterState>({
    search: '',
    fileType: '',
    minSize: '',
    maxSize: '',
    startDate: '',
    endDate: '',
  });

  // Convert FilterState to API filters
  const getApiFilters = () => {
    return {
      search: filters.search || undefined,
      file_type: filters.fileType || undefined,
      min_size: filters.minSize ? parseFloat(filters.minSize) : undefined,
      max_size: filters.maxSize ? parseFloat(filters.maxSize) : undefined,
      start_date: filters.startDate || undefined,
      end_date: filters.endDate || undefined,
    };
  };

  // Query for fetching files with filters
  const { data: files, isLoading, error } = useQuery<StoredFile[]>({
    queryKey: ['files', filters],
    queryFn: () => fileService.getFiles(getApiFilters()),
  });

  // Query for fetching storage stats
  const { data: stats } = useQuery<StorageStats>({
    queryKey: ['storage-stats'],
    queryFn: fileService.getStorageStats,
  });

  // Mutation for deleting files
  const deleteMutation = useMutation({
    mutationFn: fileService.deleteFile,
    onSuccess: () => {
      queryClient.invalidateQueries({ queryKey: ['files'] });
      queryClient.invalidateQueries({ queryKey: ['storage-stats'] });
    },
  });

  // Mutation for downloading files
  const downloadMutation = useMutation({
    mutationFn: ({ fileUrl, filename }: { fileUrl: string; filename: string }) =>
      fileService.downloadFile(fileUrl, filename),
  });

  const handleDelete = async (id: string) => {
    if (!window.confirm('Are you sure you want to delete this file?')) return;
    
    try {
      await deleteMutation.mutateAsync(id);
    } catch (err) {
      console.error('Delete error:', err);
    }
  };

  const handleDownload = async (fileUrl: string, filename: string) => {
    try {
      await downloadMutation.mutateAsync({ fileUrl, filename });
    } catch (err) {
      console.error('Download error:', err);
    }
  };

  const handleClearFilters = () => {
    setFilters({
      search: '',
      fileType: '',
      minSize: '',
      maxSize: '',
      startDate: '',
      endDate: '',
    });
  };

  const formatBytes = (bytes: number) => {
    if (bytes === 0) return '0 Bytes';
    const k = 1024;
    const sizes = ['Bytes', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return Math.round((bytes / Math.pow(k, i)) * 100) / 100 + ' ' + sizes[i];
  };

  if (isLoading) {
    return (
      <div className="p-6">
        <div className="animate-pulse space-y-4">
          <div className="h-4 bg-gray-200 rounded w-1/4"></div>
          <div className="space-y-3">
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
            <div className="h-8 bg-gray-200 rounded"></div>
          </div>
        </div>
      </div>
    );
  }

  if (error) {
    return (
      <div className="p-6">
        <div className="bg-red-50 border-l-4 border-red-400 p-4">
          <div className="flex">
            <div className="flex-shrink-0">
              <svg
                className="h-5 w-5 text-red-400"
                viewBox="0 0 20 20"
                fill="currentColor"
              >
                <path
                  fillRule="evenodd"
                  d="M10 18a8 8 0 100-16 8 8 0 000 16zM8.707 7.293a1 1 0 00-1.414 1.414L8.586 10l-1.293 1.293a1 1 0 101.414 1.414L10 11.414l1.293 1.293a1 1 0 001.414-1.414L11.414 10l1.293-1.293a1 1 0 00-1.414-1.414L10 8.586 8.707 7.293z"
                  clipRule="evenodd"
                />
              </svg>
            </div>
            <div className="ml-3">
              <p className="text-sm text-red-700">Failed to load files. Please try again.</p>
            </div>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="p-6">
      <h2 className="text-xl font-semibold text-gray-900 mb-4">Your Files</h2>

      {/* Storage Statistics */}
      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-6">
          <div className="bg-blue-50 p-4 rounded-lg border border-blue-200">
            <div className="text-2xl font-bold text-blue-600">{stats.total_files}</div>
            <div className="text-sm text-blue-800">Total Files</div>
          </div>
          <div className="bg-green-50 p-4 rounded-lg border border-green-200">
            <div className="text-2xl font-bold text-green-600">{stats.unique_files}</div>
            <div className="text-sm text-green-800">Unique Files</div>
          </div>
          <div className="bg-yellow-50 p-4 rounded-lg border border-yellow-200">
            <div className="text-2xl font-bold text-yellow-600">{stats.duplicate_files}</div>
            <div className="text-sm text-yellow-800">Duplicates</div>
          </div>
          <div className="bg-purple-50 p-4 rounded-lg border border-purple-200">
            <div className="text-2xl font-bold text-purple-600">
              {formatBytes(stats.storage_saved)}
            </div>
            <div className="text-sm text-purple-800">
              Saved ({stats.savings_percentage.toFixed(1)}%)
            </div>
          </div>
        </div>
      )}

      {/* Search and Filter Component */}
      <SearchFilters
        filters={filters}
        onFilterChange={setFilters}
        onClearFilters={handleClearFilters}
      />

      {/* Files List */}
      {!files || files.length === 0 ? (
        <div className="text-center py-12">
          <DocumentIcon className="mx-auto h-12 w-12 text-gray-400" />
          <h3 className="mt-2 text-sm font-medium text-gray-900">No files found</h3>
          <p className="mt-1 text-sm text-gray-500">
            {Object.values(filters).some(v => v !== '') 
              ? 'Try adjusting your filters'
              : 'Get started by uploading a file'}
          </p>
        </div>
      ) : (
        <div className="mt-6 flow-root">
          <div className="mb-2 text-sm text-gray-600">
            Showing {files.length} file{files.length !== 1 ? 's' : ''}
          </div>
          <ul className="-my-5 divide-y divide-gray-200">
            {files.map((file) => (
              <li 
                key={file.id} 
                className={`py-4 ${file.is_duplicate ? 'bg-yellow-50 -mx-6 px-6' : ''}`}
              >
                <div className="flex items-center space-x-4">
                  <div className="flex-shrink-0">
                    <DocumentIcon className="h-8 w-8 text-gray-400" />
                  </div>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2">
                      <p className="text-sm font-medium text-gray-900 truncate">
                        {file.original_filename}
                      </p>
                      {file.is_duplicate && (
                        <span className="inline-flex items-center px-2.5 py-0.5 rounded-full text-xs font-medium bg-yellow-100 text-yellow-800 border border-yellow-300">
                          🔄 Duplicate
                        </span>
                      )}
                    </div>
                    <p className="text-sm text-gray-500">
                      {file.file_type} • {formatBytes(file.size)}
                    </p>
                    <p className="text-sm text-gray-500">
                      Uploaded {new Date(file.uploaded_at).toLocaleString()}
                    </p>
                    {file.file_hash && (
                      <p className="text-xs text-gray-400 font-mono mt-1">
                        Hash: {file.file_hash.substring(0, 16)}...
                      </p>
                    )}
                  </div>
                  <div className="flex space-x-2">
                    <button
                      onClick={() => handleDownload(file.file_url || file.file, file.original_filename)}
                      disabled={downloadMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-primary-600 hover:bg-primary-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-primary-500 disabled:opacity-50"
                    >
                      <ArrowDownTrayIcon className="h-4 w-4 mr-1" />
                      Download
                    </button>
                    <button
                      onClick={() => handleDelete(file.id)}
                      disabled={deleteMutation.isPending}
                      className="inline-flex items-center px-3 py-2 border border-transparent shadow-sm text-sm leading-4 font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500 disabled:opacity-50"
                    >
                      <TrashIcon className="h-4 w-4 mr-1" />
                      Delete
                    </button>
                  </div>
                </div>
              </li>
            ))}
          </ul>
        </div>
      )}
    </div>
  );
};
