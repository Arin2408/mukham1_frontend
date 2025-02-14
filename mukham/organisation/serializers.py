from rest_framework import serializers
from .models import Organisation, UserOrganisation

# Organisation Serializer
class OrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = Organisation
        fields = '__all__'  # Or list specific fields like: ['name', 'email', 'details']

# UserOrganisation Serializer
class UserOrganisationSerializer(serializers.ModelSerializer):
    class Meta:
        model = UserOrganisation
        fields = '__all__'
