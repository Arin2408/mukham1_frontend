from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view
from .models import Department
from .serializers import DepartmentSerializer

@api_view(['POST'])
def add_department(request):
    serializer = DepartmentSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_departments(request):
    departments = Department.objects.all()
    serializer = DepartmentSerializer(departments, many=True)
    return Response(serializer.data)
