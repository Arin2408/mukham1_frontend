from django.urls import path
from .views import list_departments, add_department

urlpatterns = [
    path('departments/', list_departments, name='list_departments'),  
    path('departments/add/', add_department, name='add_department'),  
]
