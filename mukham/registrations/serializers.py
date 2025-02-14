# from rest_framework import serializers
# from .models import User

# class SignupSerializer(serializers.ModelSerializer):
#     class Meta:
#         model = User
#         fields = ['name', 'mobile_number']

# class LoginSerializer(serializers.Serializer):
#     mobile_number = serializers.CharField(max_length=15)
#     password = serializers.CharField(max_length=255)

#     class Meta:
#         model = User
#         fields = ['mobile_number', 'password']