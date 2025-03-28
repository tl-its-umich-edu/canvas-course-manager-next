from rest_framework import serializers

class CourseSerializer(serializers.Serializer):
    # Define the fields you want to update. Adjust fields according to the Canvas API.
    newName = serializers.CharField(max_length=255, required=True)