from rest_framework import serializers
from .models import File, FileReference

class FileSerializer(serializers.ModelSerializer):
    class Meta:
        model = File
        fields = ['id', 'file', 'original_filename', 'file_type', 'size', 'uploaded_at', 'file_hash', 'reference_count']
        read_only_fields = ['id', 'uploaded_at', 'file_hash', 'reference_count']

class FileReferenceSerializer(serializers.ModelSerializer):
    file_url = serializers.SerializerMethodField()
    file_type = serializers.CharField(source='file.file_type', read_only=True)
    size = serializers.IntegerField(source='file.size', read_only=True)
    file_hash = serializers.CharField(source='file.file_hash', read_only=True)
    
    class Meta:
        model = FileReference
        fields = ['id', 'original_filename', 'uploaded_at', 'is_duplicate', 'file_url', 'file_type', 'size', 'file_hash']
        read_only_fields = ['id', 'uploaded_at', 'is_duplicate']
    
    def get_file_url(self, obj):
        request = self.context.get('request')
        if obj.file.file and hasattr(obj.file.file, 'url'):
            if request is not None:
                return request.build_absolute_uri(obj.file.file.url)
            return obj.file.file.url
        return None

class StorageStatsSerializer(serializers.Serializer):
    total_files = serializers.IntegerField()
    unique_files = serializers.IntegerField()
    duplicate_files = serializers.IntegerField()
    total_size = serializers.IntegerField()
    actual_storage_used = serializers.IntegerField()
    storage_saved = serializers.IntegerField()
    savings_percentage = serializers.FloatField()