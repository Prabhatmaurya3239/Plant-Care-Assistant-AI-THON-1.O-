from django.urls import path
from .views import home, analyze_plant
from . import views

urlpatterns = [
    path('', views.home, name='home'),
    path('analyze_plant/', analyze_plant, name='analyze_plant'),
    path('voice_diagnose/', views.voice_diagnose, name='voice_diagnose'),
]
