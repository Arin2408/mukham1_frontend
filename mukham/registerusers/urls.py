from django.urls import path
from .views import signup, login

urlpatterns = [
    path('org/signup/', signup, name='signup'),
    path('org/login/', login, name='login'),
]