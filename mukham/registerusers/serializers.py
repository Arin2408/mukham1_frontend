from rest_framework import serializers
from .models import CustomUser

class SignupSerializer(serializers.ModelSerializer):
    class Meta:
        model = CustomUser
        fields = ['mobile_number', 'name']
        extra_kwargs = {
            'password': {'write_only': True, 'required': False}
        }

class LoginSerializer(serializers.Serializer):
    mobile_number = serializers.CharField()
    password = serializers.CharField()
    class Meta:
        model = CustomUser
        fields = ['mobile_number', 'password']
