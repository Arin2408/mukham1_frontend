from django.urls import path
from .views import add_designation, list_designations

urlpatterns = [
    path('add-designation/', add_designation, name='add_designation'),
    path('designations/', list_designations, name='list_designations'),
]
