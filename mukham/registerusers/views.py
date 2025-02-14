from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from rest_framework.permissions import AllowAny, IsAuthenticated
from rest_framework_simplejwt.tokens import RefreshToken
from .models import CustomUser
from .serializers import SignupSerializer, LoginSerializer

from django.db import IntegrityError

@api_view(['POST'])
@permission_classes([AllowAny])
def signup(request):
    serializer = SignupSerializer(data=request.data)
    print("Request data:", request.data) 
    if serializer.is_valid():
        try:
            # Attempt to create a new user
            user = CustomUser.objects.create(
                mobile_number=serializer.validated_data['mobile_number'],
                name=serializer.validated_data['name']
            )
            generated_password = user.generate_password()
            user.password = generated_password
            user.save()

            return Response({
                'mobile_number': user.mobile_number,
                'generated_password': generated_password,
                'message': 'User created successfully'
            }, status=status.HTTP_201_CREATED)

        except IntegrityError as e:
            return Response({'error': 'Mobile number already exists'}, status=status.HTTP_400_BAD_REQUEST)
        except Exception as e:
            return Response({'error': str(e)}, status=status.HTTP_500_INTERNAL_SERVER_ERROR)
    else:
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['POST'])
@permission_classes([AllowAny])
def login(request):
    serializer = LoginSerializer(data=request.data)
    if serializer.is_valid():
        try:
            user = CustomUser.objects.get(
                mobile_number=serializer.validated_data['mobile_number']
            )
            # Directly compare the raw password
            if user.password == serializer.validated_data['password']:
                refresh = RefreshToken.for_user(user)
                return Response({
                    'access': str(refresh.access_token),
                    'refresh': str(refresh),
                })
            return Response({'error': 'Invalid password'}, status=status.HTTP_401_UNAUTHORIZED)
        except CustomUser.DoesNotExist:
            return Response({'error': 'User not found'}, status=status.HTTP_404_NOT_FOUND)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
