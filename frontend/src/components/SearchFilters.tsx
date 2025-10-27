import React, { useState, useEffect } from 'react';
import { MagnifyingGlassIcon, FunnelIcon, XMarkIcon } from '@heroicons/react/24/outline';

export interface FilterState {
  search: string;
  fileType: string;
  minSize: string;
  maxSize: string;
  startDate: string;
  endDate: string;
}

interface SearchFiltersProps {
  filters: FilterState;
  onFilterChange: (filters: FilterState) => void;
  onClearFilters: () => void;
}

export const SearchFilters: React.FC<SearchFiltersProps> = ({
  filters,
  onFilterChange,
  onClearFilters,
}) => {
  const [showAdvanced, setShowAdvanced] = useState(false);

  // --- LOCAL SEARCH STATE ---
  const [localSearch, setLocalSearch] = useState(filters.search);

  // Keep localSearch in sync if filters.search changes externally
  useEffect(() => {
    setLocalSearch(filters.search);
  }, [filters.search]);

  const handleChange = (field: keyof FilterState, value: string) => {
    onFilterChange({ ...filters, [field]: value });
  };

  const hasActiveFilters = Object.values(filters).some(value => value !== '');

  return (
    <div className="bg-white p-4 rounded-lg shadow-sm border border-gray-200 mb-6">
      {/* Search Bar */}
      <div className="flex items-center space-x-2">
        <div className="relative flex-1">
          <div className="absolute inset-y-0 left-0 pl-3 flex items-center pointer-events-none">
            <MagnifyingGlassIcon className="h-5 w-5 text-gray-400" />
          </div>
          <input
            type="text"
            placeholder="Search files by name..."
            value={localSearch}  // <-- use local state
            onChange={(e) => setLocalSearch(e.target.value)} // <-- update local state
            className="block w-full pl-10 pr-3 py-2 border border-gray-300 rounded-md leading-5 bg-white placeholder-gray-500 focus:outline-none focus:placeholder-gray-400 focus:ring-1 focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
          />
        </div>
        {/* SEARCH BUTTON */}
        <button
          onClick={() => handleChange('search', localSearch)} // update parent filters
          className="px-3 py-1 rounded-md bg-blue-600 text-white hover:bg-blue-700 text-sm"
        >
          Search
        </button>
      </div>

      {/* Advanced Filters Toggle */}
      <button
        onClick={() => setShowAdvanced(!showAdvanced)}
        className="mt-3 inline-flex items-center text-sm text-gray-600 hover:text-gray-900"
      >
        <FunnelIcon className="h-4 w-4 mr-1" />
        {showAdvanced ? 'Hide' : 'Show'} Advanced Filters
      </button>

      {/* Advanced Filters */}
      {showAdvanced && (
        <div className="mt-4 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {/* File Type Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              File Type
            </label>
            <select
              value={filters.fileType}
              onChange={(e) => handleChange('fileType', e.target.value)}
              className="block w-full pl-3 pr-10 py-2 text-base border border-gray-300 focus:outline-none focus:ring-blue-500 focus:border-blue-500 sm:text-sm rounded-md"
            >
              <option value="">All Types</option>
              <option value="application/pdf">PDF</option>
              <option value="image/jpeg">JPEG Image</option>
              <option value="image/png">PNG Image</option>
              <option value="text/plain">Text</option>
              <option value="application/zip">ZIP</option>
              <option value="application/json">JSON</option>
            </select>
          </div>

          {/* Min Size Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Min Size (KB)
            </label>
            <input
              type="number"
              placeholder="0"
              value={filters.minSize}
              onChange={(e) => handleChange('minSize', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Max Size Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Max Size (KB)
            </label>
            <input
              type="number"
              placeholder="Unlimited"
              value={filters.maxSize}
              onChange={(e) => handleChange('maxSize', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* Start Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Uploaded After
            </label>
            <input
              type="date"
              value={filters.startDate}
              onChange={(e) => handleChange('startDate', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>

          {/* End Date Filter */}
          <div>
            <label className="block text-sm font-medium text-gray-700 mb-1">
              Uploaded Before
            </label>
            <input
              type="date"
              value={filters.endDate}
              onChange={(e) => handleChange('endDate', e.target.value)}
              className="block w-full px-3 py-2 border border-gray-300 rounded-md shadow-sm focus:ring-blue-500 focus:border-blue-500 sm:text-sm"
            />
          </div>
        </div>
      )}

      {/* Clear Filters Button */}
      {hasActiveFilters && (
        <button
          onClick={onClearFilters}
          className="mt-4 inline-flex items-center px-3 py-2 border border-gray-300 shadow-sm text-sm leading-4 font-medium rounded-md text-gray-700 bg-white hover:bg-gray-50 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-blue-500"
        >
          <XMarkIcon className="h-4 w-4 mr-1" />
          Clear All Filters
        </button>
      )}
    </div>
  );
};
