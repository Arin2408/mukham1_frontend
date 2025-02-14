# # views.py
# from rest_framework import status
# from rest_framework.response import Response
# from rest_framework.decorators import api_view, permission_classes
# from django.contrib.auth import authenticate
# from rest_framework_simplejwt.tokens import RefreshToken
# from rest_framework.permissions import AllowAny
# from .models import User

# def get_tokens_for_user(user):
#     refresh = RefreshToken.for_user(user)
#     return {
#         'refresh': str(refresh),
#         'access': str(refresh.access_token),
#     }

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def organisation_signup(request):
#     mobile_number = request.data.get('mobile_number')
#     name = request.data.get('name')
    
#     # Generate random password and hash it
#     user = User.objects.create(
#         mobile_number=mobile_number,
#         first_name=name
#     )
#     generated_password = user.set_random_password()
#     user.save()

#     return Response({
#         'message': 'User created successfully',
#         'mobile_number': user.mobile_number,
#         'generated_password': generated_password  # Only for demonstration!
#     }, status=status.HTTP_201_CREATED)

# @api_view(['POST'])
# @permission_classes([AllowAny])
# def organisation_login(request):
#     mobile_number = request.data.get('mobile_number')
#     password = request.data.get('password')

#     user = authenticate(request, username=mobile_number, password=password)
    
#     if user is not None:
#         tokens = get_tokens_for_user(user)
#         return Response({
#             'access': tokens['access'],
#             'name': user.first_name,
#             'mobile_number': user.mobile_number
#         }, status=status.HTTP_200_OK)
        
#     return Response({'error': 'Invalid credentials'}, status=status.HTTP_401_UNAUTHORIZED)