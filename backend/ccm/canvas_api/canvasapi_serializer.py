from rest_framework import serializers

class CourseSerializer(serializers.Serializer):
    # Define the fields you want to update. Adjust fields according to the Canvas API.
    newName = serializers.CharField(max_length=255, required=True)

class SectionSerializer(serializers.Serializer):
    id = serializers.IntegerField(required=True)
    name = serializers.CharField(max_length=255)
    course_id = serializers.IntegerField(required=True)
    total_students = serializers.IntegerField(required=True)
    nonxlist_course_id = serializers.IntegerField()
