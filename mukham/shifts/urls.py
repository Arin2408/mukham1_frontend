from django.urls import path
from .views import add_shift, list_shifts

urlpatterns = [
    path('add-shift/', add_shift, name='add_shift'),
    path('shifts/', list_shifts, name='list_shifts'),
]
