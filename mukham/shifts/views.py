from rest_framework import status
from rest_framework.response import Response
from rest_framework.decorators import api_view, permission_classes
from .models import Shift
from .serializers import ShiftSerializer
from rest_framework.permissions import AllowAny

@api_view(['POST'])
@permission_classes([AllowAny])
def add_shift(request):
    serializer = ShiftSerializer(data=request.data)
    if serializer.is_valid():
        serializer.save()
        return Response(serializer.data, status=status.HTTP_201_CREATED)
    return Response(serializer.errors, status=status.HTTP_400_BAD_REQUEST)

@api_view(['GET'])
def list_shifts(request):
    shifts = Shift.objects.all()
    serializer = ShiftSerializer(shifts, many=True)
    return Response(serializer.data)
