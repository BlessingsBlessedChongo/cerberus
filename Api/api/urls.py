from .views import CustomAuthToken, LatestMetricsView
from django.urls import path
from .views import MetricHistoryView, AlertListView
urlpatterns = [
    path('auth/login/', CustomAuthToken.as_view(), name='api_token_auth'),
    path('metrics/latest/', LatestMetricsView.as_view(), name='metrics-latest'),
    path('metrics/history/', MetricHistoryView.as_view(), name='metrics-history'),
    path('alerts/', AlertListView.as_view(), name='alerts'),
]