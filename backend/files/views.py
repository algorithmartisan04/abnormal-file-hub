from django.shortcuts import render
from django.db.models import Sum
from rest_framework import viewsets, status
from rest_framework.response import Response
from rest_framework.decorators import action
from .models import File, FileReference, calculate_file_hash
from .serializers import FileSerializer, FileReferenceSerializer, StorageStatsSerializer

class FileViewSet(viewsets.ModelViewSet):
    queryset = FileReference.objects.all().select_related('file')
    serializer_class = FileReferenceSerializer

    def create(self, request, *args, **kwargs):
        file_obj = request.FILES.get('file')
        if not file_obj:
            return Response({'error': 'No file provided'}, status=status.HTTP_400_BAD_REQUEST)
        
        # Calculate file hash for deduplication
        file_hash = calculate_file_hash(file_obj)
        file_obj.seek(0)  # Reset file pointer after reading
        
        # Check if file already exists (deduplication check)
        existing_file = File.objects.filter(file_hash=file_hash).first()
        
        if existing_file:
            # File is a duplicate - create reference only
            existing_file.reference_count += 1
            existing_file.save()
            
            file_reference = FileReference.objects.create(
                file=existing_file,
                original_filename=file_obj.name,
                is_duplicate=True
            )
            
            serializer = self.get_serializer(file_reference)
            return Response({
                **serializer.data,
                'message': 'Duplicate file detected. Reference created to existing file.',
                'storage_saved': existing_file.size
            }, status=status.HTTP_201_CREATED)
        else:
            # New file - store it
            file_instance = File.objects.create(
                file=file_obj,
                original_filename=file_obj.name,
                file_type=file_obj.content_type,
                size=file_obj.size,
                file_hash=file_hash,
                reference_count=1
            )
            
            file_reference = FileReference.objects.create(
                file=file_instance,
                original_filename=file_obj.name,
                is_duplicate=False
            )
            
            serializer = self.get_serializer(file_reference)
            return Response({
                **serializer.data,
                'message': 'File uploaded successfully.'
            }, status=status.HTTP_201_CREATED)

    def destroy(self, request, *args, **kwargs):
        instance = self.get_object()
        file_instance = instance.file
        
        # Delete the reference
        instance.delete()
        
        # Decrease reference count
        file_instance.reference_count -= 1
        
        # If no more references, delete the actual file
        if file_instance.reference_count <= 0:
            file_instance.file.delete()
            file_instance.delete()
        else:
            file_instance.save()
        
        return Response(status=status.HTTP_204_NO_CONTENT)

    @action(detail=False, methods=['get'])
    def storage_stats(self, request):
        """Get storage optimization statistics"""
        total_references = FileReference.objects.count()
        unique_files = File.objects.count()
        duplicate_references = FileReference.objects.filter(is_duplicate=True).count()
        
        # Calculate total size if all files were stored separately
        total_size = FileReference.objects.select_related('file').aggregate(
            total=Sum('file__size')
        )['total'] or 0
        
        # Calculate actual storage used (unique files only)
        actual_storage = File.objects.aggregate(
            total=Sum('size')
        )['total'] or 0
        
        storage_saved = total_size - actual_storage
        savings_percentage = (storage_saved / total_size * 100) if total_size > 0 else 0
        
        stats = {
            'total_files': total_references,
            'unique_files': unique_files,
            'duplicate_files': duplicate_references,
            'total_size': total_size,
            'actual_storage_used': actual_storage,
            'storage_saved': storage_saved,
            'savings_percentage': round(savings_percentage, 2)
        }
        
        serializer = StorageStatsSerializer(stats)
        return Response(serializer.data)

    @action(detail=False, methods=['get'])
    def file_types(self, request):
        """Get list of unique file types for filtering"""
        file_types = File.objects.values_list('file_type', flat=True).distinct()
        return Response({'file_types': list(file_types)})
    
    def get_queryset(self):
        qs = FileReference.objects.all().select_related('file')

        # --- Search by filename ---
        search = self.request.query_params.get('search') or self.request.query_params.get('filename')
        if search:
            from django.db.models import Q
            qs = qs.filter(
                Q(original_filename__icontains=search) |
                Q(file__original_filename__icontains=search)
            )

        # --- Filter by file type ---
        file_type = self.request.query_params.get('file_type') or self.request.query_params.get('type')
        if file_type:
            qs = qs.filter(file__file_type__icontains=file_type)

        # --- Filter by size range ---
        min_size = self.request.query_params.get('min_size')
        max_size = self.request.query_params.get('max_size')
        if min_size:
            qs = qs.filter(file__size__gte=min_size)
        if max_size:
            qs = qs.filter(file__size__lte=max_size)

        # --- Filter by upload date ---
        start_date = self.request.query_params.get('start_date')
        end_date = self.request.query_params.get('end_date')
        if start_date:
            qs = qs.filter(file__uploaded_at__gte=start_date)
        if end_date:
            qs = qs.filter(file__uploaded_at__lte=end_date)

        return qs