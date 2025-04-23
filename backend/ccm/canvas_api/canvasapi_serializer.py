from rest_framework import serializers

class CourseSerializer(serializers.Serializer):
    # Define the fields you want to update. Adjust fields according to the Canvas API.
    newName = serializers.CharField(max_length=255, required=True)

class CourseSectionSerializer(serializers.Serializer):
    sections = serializers.ListField(
        child=serializers.CharField(max_length=255, required=True)
    )

    def validate_sections(self, value):
        if len(value) > 60:
            raise serializers.ValidationError("The list cannot be more than 60 items.")
        return value

class CanvasObjectROSerializer(serializers.BaseSerializer):
    """
    Serializer for generic Canvas objects from the Canvas API
    Adapted from the Django REST Framework documentation:
    https://www.django-rest-framework.org/api-guide/serializers/#creating-new-base-classes
    """
    def __init__(self, *args, allowed_fields=None, append_fields=None, **kwargs):
        super().__init__(*args, **kwargs)
        self.allowed_fields = allowed_fields
        self.append_fields = append_fields
    
    def retrieve_primitive(self, value):
        """
        Recursively retrieve primitive values from input
        """
        if isinstance(value, dict):
            return {k: self.retrieve_primitive(v) for k, v in value.items()}
        elif isinstance(value, list):
            return [self.retrieve_primitive(item) for item in value]
        elif isinstance(value, (str, int, bool, float, type(None))):
            return value
        else:
            # Fallback for other types
            return str(value)

    def convert_canvas_object_to_primitives(self, instance):
        data = {}
        for attr in dir(instance):
            value = getattr(instance, attr)
            if attr.startswith('_'):
                continue  # skip private/internal attrs
            if callable(value):
                continue  # skip methods
            elif hasattr(value, '__dict__') and isinstance(value, object):
                # Try JSON serializing nested CanvasObjects by getting their dict
                data[attr] = self.convert_canvas_object_to_primitives(value)
            elif isinstance(value, list) and not any(isinstance(item, (str, int, bool, float, type(None))) for item in value):
                # If the list contains CanvasObjects, convert them to primitives
                data[attr] = [self.convert_canvas_object_to_primitives(item) for item in value]
            else:
                data[attr] = self.retrieve_primitive(value)
        return data

    def to_representation(self, instance):
        data = self.convert_canvas_object_to_primitives(instance)
        # Filter out fields not in allowed_fields
        if self.allowed_fields:
            data = {key: value for key, value in data.items() if key in self.allowed_fields}
        
        # Append fields from append_fields if provided
        if self.append_fields:
            for key, value in self.append_fields.items():
                if key not in data:
                    data[key] = value
        
        return data