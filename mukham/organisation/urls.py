from django.urls import path
from .views import create_organisation, create_user_organisation

urlpatterns = [
    path('organisations/', create_organisation, name='create_organisation'),
    path('user-organisations/', create_user_organisation, name='create_user_organisationl'),
]
