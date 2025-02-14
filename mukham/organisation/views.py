from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.response import Response
from rest_framework import status
from .models import Organisation, UserOrganisation
from .serializers import OrganisationSerializer, UserOrganisationSerializer
from rest_framework.permissions import IsAuthenticated
from rest_framework_simplejwt.authentication import JWTAuthentication

# Organisation API (GET/POST) with authentication
@api_view(['GET', 'POST'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])
def create_organisation(request):
    print("Received request from user:", request.user)
    print("Authentication status:", request.user.is_authenticated)
    
    if request.method == 'GET':
        # Handle GET request to return the list of organisations
        organisations = Organisation.objects.all()
        serializer = OrganisationSerializer(organisations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)
    
    elif request.method == 'POST':
        # Handle POST request to create a new organisation
        serializer = OrganisationSerializer(data=request.data)
        if serializer.is_valid():
            organisation = serializer.save()  # Save the object and get the instance
            return Response({
                'org_id': organisation.org_id,  # Explicitly include org_id in the response
                'data': serializer.data
            }, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

# UserOrganisation API (GET/POST) with authentication
@api_view(['GET', 'POST'])
@permission_classes([IsAuthenticated])
def create_user_organisation(request):
    if request.method == 'GET':
        # Handle GET request to return the list of user organisations
        user_organisations = UserOrganisation.objects.all()
        serializer = UserOrganisationSerializer(user_organisations, many=True)
        return Response(serializer.data, status=status.HTTP_200_OK)

    elif request.method == 'POST':
        # Handle POST request to create a new user organisation
        serializer = UserOrganisationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)
