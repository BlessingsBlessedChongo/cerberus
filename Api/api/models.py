from django.db import models

class Metric(models.Model):
    METRIC_TYPES = [
        ('CPU_Usage', 'CPU Usage'),
        ('Available_RAM', 'Available RAM'),
        ('Disk_Free_C', 'Disk Free C'),
        ('Process_', 'Process Status'),
        ('METRICS_AGGREGATE', 'Aggregate Metrics'),
    ]
    metric_type = models.CharField(max_length=50, choices=METRIC_TYPES)
    value = models.FloatField(null=True, blank=True)    # for numeric metrics
    text_value = models.TextField(blank=True, null=True)  # for process status
    timestamp = models.DateTimeField()

    def __str__(self):
        return f"{self.timestamp} - {self.metric_type}: {self.value or self.text_value}"