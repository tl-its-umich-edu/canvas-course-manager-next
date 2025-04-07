from rest_framework import serializers
from canvasapi.section import Section

class CourseSerializer(serializers.Serializer):
    # Define the fields you want to update. Adjust fields according to the Canvas API.
    newName = serializers.CharField(max_length=255, required=True)

class CanvasObjectROSerializer(serializers.BaseSerializer):
    """
    Serializer for generic Canvas objects from the Canvas API
    Adapted from the Django REST Framework documentation:
    https://www.django-rest-framework.org/api-guide/serializers/#creating-new-base-classes
    """
    def __init__(self, *args, allowed_fields=None, **kwargs):
      super().__init__(*args, **kwargs)
      self.allowed_fields = allowed_fields

    def convert_to_primitives(self, instance):
        data = {}
        for attr in dir(instance):
            value = getattr(instance, attr)
            if attr.startswith('_'):
                continue  # skip private/internal attrs
            if callable(value):
                continue  # skip methods
            if hasattr(value, '__dict__') and isinstance(value, object):
                # Try JSON serializing nested CanvasObjects by getting their dict
                data[attr] = self.convert_to_primitives(value)
            elif isinstance(value, (str, int, bool, float, type(None))):
                # Primitive types can be passed through unmodified.
                data[attr] = value 
            elif isinstance(value, list):
                # For lists, check if they contain CanvasObjects or primitives
                if all(isinstance(item, (str, int, bool, float, type(None))) for item in value):
                    data[attr] = value
                else:
                    data[attr] = [self.convert_to_primitives(item) for item in value]
            else:
                # Fallback for other types
                data[attr] = str(value)
        return data

    def to_representation(self, instance):
        data = self.convert_to_primitives(instance)
        # Filter out fields not in allowed_fields
        if self.allowed_fields:
            data = {key: value for key, value in data.items() if key in self.allowed_fields}
        return data