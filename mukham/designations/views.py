from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Designation
from .serializers import DesignationSerializer

@api_view(['POST'])
def add_designation(request):
    serializer = DesignationSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_designations(request):
    designations = Designation.objects.all()
    serializer = DesignationSerializer(designations, many=True)
    return Response(serializer.data)
