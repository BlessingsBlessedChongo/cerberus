from rest_framework import generics
from rest_framework.response import Response
from rest_framework.permissions import IsAuthenticated
from .models import Metric
from .serializers import MetricSerializer
from django.utils import timezone
from datetime import timedelta
from rest_framework.authtoken.views import ObtainAuthToken
from rest_framework.authtoken.models import Token


class LatestMetricsView(generics.ListAPIView):
    """Return the most recent metrics of each type."""
    serializer_class = MetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Get the latest entry for each metric type within the last hour
        one_hour_ago = timezone.now() - timedelta(hours=1)
        return Metric.objects.filter(timestamp__gte=one_hour_ago)

class MetricHistoryView(generics.ListAPIView):
    """Return historical metrics, optionally filtered by hours and type."""
    serializer_class = MetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        hours = self.request.query_params.get('hours', 24)
        metric_type = self.request.query_params.get('type', None)
        start_time = timezone.now() - timedelta(hours=int(hours))
        qs = Metric.objects.filter(timestamp__gte=start_time)
        if metric_type:
            qs = qs.filter(metric_type=metric_type)
        return qs.order_by('-timestamp')

class AlertListView(generics.ListAPIView):
    """Return recent ALERT entries (if you log them as Metrics or separate model)."""
    serializer_class = MetricSerializer
    permission_classes = [IsAuthenticated]

    def get_queryset(self):
        # Assuming alerts are stored as Metric with metric_type='ALERT'
        return Metric.objects.filter(metric_type='ALERT').order_by('-timestamp')[:50]
    


class CustomAuthToken(ObtainAuthToken):
    def post(self, request, *args, **kwargs):
        serializer = self.serializer_class(data=request.data,
                                           context={'request': request})
        serializer.is_valid(raise_exception=True)
        user = serializer.validated_data['user']
        token, created = Token.objects.get_or_create(user=user)
        return Response({
            'token': token.key,
            'user_id': user.pk,
            'username': user.username
        })