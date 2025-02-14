from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import IsAuthenticated
from rest_framework.response import Response
from rest_framework.permissions import AllowAny
from rest_framework import status
from rest_framework_simplejwt.tokens import RefreshToken
from .models import Customuser
from .serializers import Signupserializer, Loginserializer

@api_view(['POST'])
@permission_classes([AllowAny])
def signup_view(request):
    serializer = Signupserializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response({"message": "User registered successfully!"}, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny]) 
def login_view(request):
    serializer = Loginserializer(data=request.data)
    if serializer.is_valid():
        email = serializer.validated_data['email']
        password = serializer.validated_data['password']
        
        try:
            user = Customuser.objects.get(email=email)
        except Customuser.DoesNotExist:
            return Response({"error": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

        if user.password != password:
            return Response({"error": "Invalid email or password"}, status=status.HTTP_400_BAD_REQUEST)

        refresh = RefreshToken.for_user(user)
        return Response({
            "access_token": str(refresh.access_token),
            "refresh_token": str(refresh)
        }, status=status.HTTP_200_OK)

    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

