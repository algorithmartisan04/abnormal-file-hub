import axios from "axios";
import { StoredFile, StorageStats } from "../types/file";

const API_URL = process.env.REACT_APP_API_URL || "http://localhost:8000/api";

export interface FileFilters {
  search?: string;
  file_type?: string;
  min_size?: number;
  max_size?: number;
  start_date?: string;
  end_date?: string;
}

export const fileService = {
  /**
   * Uploads a file to the server.
   * The file must be a File object from the globalThis scope.
   * The file is sent as a multipart/form-data request.
   * The response is a StoredFile object containing the uploaded file's information.
   * @param file The file to be uploaded.
   * @returns A promise resolving to the uploaded file's information.
   */
  async uploadFile(file: globalThis.File): Promise<StoredFile> {
    const formData = new FormData();
    formData.append("file", file, file.name);

    const response = await axios.post(`${API_URL}/files/`, formData, {
      headers: {
        "Content-Type": "multipart/form-data",
      },
    });
    return response.data;
  },

  async getFiles(filters?: FileFilters): Promise<StoredFile[]> {
    const params = new URLSearchParams();

    if (filters?.search) {
      params.append("search", filters.search);
    }
    if (filters?.file_type) {
      params.append("file_type", filters.file_type);
    }
    if (filters?.min_size) {
      // Convert KB to bytes for backend
      params.append("min_size", (filters.min_size * 1024).toString());
    }
    if (filters?.max_size) {
      // Convert KB to bytes for backend
      params.append("max_size", (filters.max_size * 1024).toString());
    }
    if (filters?.start_date) {
      params.append("start_date", filters.start_date);
    }
    if (filters?.end_date) {
      params.append("end_date", filters.end_date);
    }

    const queryString = params.toString();
    const url = queryString
      ? `${API_URL}/files/?${queryString}`
      : `${API_URL}/files/`;

    const response = await axios.get(url);
    return response.data;
  },

  async deleteFile(id: string): Promise<void> {
    await axios.delete(`${API_URL}/files/${id}/`);
  },

  async getStorageStats(): Promise<StorageStats> {
    const response = await axios.get(`${API_URL}/files/storage_stats/`);
    return response.data;
  },

  async downloadFile(fileUrl: string, filename: string): Promise<void> {
    try {
      const response = await axios.get(fileUrl, {
        responseType: "blob",
      });

      const blob = new Blob([response.data]);
      const url = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = url;
      link.download = filename;
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(url);
    } catch (error) {
      console.error("Download error:", error);
      throw new Error("Failed to download file");
    }
  },
};
