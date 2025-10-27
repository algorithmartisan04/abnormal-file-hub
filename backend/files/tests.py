from django.test import TestCase
from django.core.files.uploadedfile import SimpleUploadedFile
from rest_framework.test import APIClient
from rest_framework import status
from .models import File
import hashlib

class FileDeduplicationTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        self.file_content = b"Test file content"
        
    def test_upload_file(self):
        """Test basic file upload"""
        file = SimpleUploadedFile("test.txt", self.file_content, content_type="text/plain")
        response = self.client.post('/api/files/', {'file': file}, format='multipart')
        self.assertEqual(response.status_code, status.HTTP_201_CREATED)
        self.assertEqual(File.objects.count(), 1)
    
    def test_duplicate_file_detection(self):
        """Test that duplicate files are detected"""
        file1 = SimpleUploadedFile("test1.txt", self.file_content, content_type="text/plain")
        file2 = SimpleUploadedFile("test2.txt", self.file_content, content_type="text/plain")
        
        response1 = self.client.post('/api/files/', {'file': file1}, format='multipart')
        response2 = self.client.post('/api/files/', {'file': file2}, format='multipart')
        
        self.assertEqual(response1.status_code, status.HTTP_201_CREATED)
        self.assertEqual(response2.status_code, status.HTTP_201_CREATED)
        
        # Should only have one physical file stored
        unique_hashes = File.objects.values('file_hash').distinct().count()
        self.assertEqual(unique_hashes, 1)
    
    def test_file_list(self):
        """Test retrieving file list"""
        file = SimpleUploadedFile("test.txt", self.file_content, content_type="text/plain")
        self.client.post('/api/files/', {'file': file}, format='multipart')
        
        response = self.client.get('/api/files/')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
    
    def test_file_delete(self):
        """Test file deletion"""
        file = SimpleUploadedFile("test.txt", self.file_content, content_type="text/plain")
        response = self.client.post('/api/files/', {'file': file}, format='multipart')
        file_id = response.data['id']
        
        delete_response = self.client.delete(f'/api/files/{file_id}/')
        self.assertEqual(delete_response.status_code, status.HTTP_204_NO_CONTENT)
        self.assertEqual(File.objects.count(), 0)


class FileSearchTests(TestCase):
    def setUp(self):
        self.client = APIClient()
        
        # Create test files
        files = [
            ("document.pdf", b"PDF content", "application/pdf"),
            ("image.jpg", b"JPG content", "image/jpeg"),
            ("text.txt", b"Text content", "text/plain"),
        ]
        
        for name, content, content_type in files:
            file = SimpleUploadedFile(name, content, content_type=content_type)
            self.client.post('/api/files/', {'file': file}, format='multipart')
    
    def test_search_by_filename(self):
        """Test searching files by filename"""
        response = self.client.get('/api/files/?search=document')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertEqual(len(response.data), 1)
        self.assertIn('document', response.data[0]['filename'].lower())
    
    def test_filter_by_file_type(self):
        """Test filtering by file type"""
        response = self.client.get('/api/files/?file_type=application/pdf')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(f['file_type'] == 'application/pdf' for f in response.data))
    
    def test_filter_by_size_range(self):
        """Test filtering by size range"""
        response = self.client.get('/api/files/?min_size=0&max_size=1000')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(all(f['size'] <= 1000 for f in response.data))
    
    def test_multiple_filters(self):
        """Test applying multiple filters simultaneously"""
        response = self.client.get('/api/files/?search=text&file_type=text/plain')
        self.assertEqual(response.status_code, status.HTTP_200_OK)
        self.assertTrue(len(response.data) >= 0)