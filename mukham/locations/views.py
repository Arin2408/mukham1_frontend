from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes, authentication_classes
from rest_framework.permissions import IsAuthenticated
from .models import Location
from .serializers import LocationSerializer
from organisation.models import Organisation 
from rest_framework_simplejwt.authentication import JWTAuthentication
# View to add a new location (POST) and list all locations (GET)
@api_view(['POST', 'GET'])
@authentication_classes([JWTAuthentication])
@permission_classes([IsAuthenticated])  # Only authenticated users can access
def location_list_create(request):
    # Handle POST request: Add new location
    if request.method == 'POST':
        # Fetch the organization of the logged-in user
        # user = request.user
        # if hasattr(user, 'organisation'):  # Assuming 'organisation' is the related field
        #     organisation = user.organisation
        # else:
        #     return Response({'error': 'No associated organization found for the user'}, status=status.HTTP_400_BAD_REQUEST)

        # # Prefill the organization field in the data
        # data = request.data.copy()
        # data['org'] = organisation.id  # Attach org ID to the request data

        # Proceed to validate and save the location with prefilled organization
        serializer = LocationSerializer(data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data, status=status.HTTP_201_CREATED)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Handle GET request: List all locations
    elif request.method == 'GET':
        locations = Location.objects.all()
        serializer = LocationSerializer(locations, many=True)
        return Response(serializer.data)

# View to retrieve, update or delete a specific location
@api_view(['GET', 'PUT', 'DELETE'])
@permission_classes([IsAuthenticated])
def location_detail(request, location_id):
    # Ensure JWT token is in cookies
    try:
        location = Location.objects.get(location_id=location_id)
    except Location.DoesNotExist:
        return Response({'error': 'Location not found'}, status=status.HTTP_404_NOT_FOUND)

    # Handle GET request: Retrieve location details
    if request.method == 'GET':
        serializer = LocationSerializer(location)
        return Response(serializer.data)

    # Handle PUT request: Update location details
    elif request.method == 'PUT':
        serializer = LocationSerializer(location, data=request.data)
        if serializer.is_valid():
            serializer.save()
            return Response(serializer.data)
        return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

    # Handle DELETE request: Delete a location
    elif request.method == 'DELETE':
        location.delete()
        return Response(status=status.HTTP_204_NO_CONTENT)
