from django.core.management.base import BaseCommand
from api.models import Metric
from datetime import datetime
import re

class Command(BaseCommand):
    help = 'Import metrics from watchdog.log into the database'

    def add_arguments(self, parser):
        parser.add_argument('--logfile', type=str, default='../Core/watchdog.log',
                            help='Path to watchdog.log')

    def handle(self, *args, **options):
        logfile = options['logfile']
        self.stdout.write(f"Importing from {logfile}...")
        count = 0
        line_pattern = re.compile(
            r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+([\w_]+):\s+(.*)'
        )
        aggregate_pattern = re.compile(
            r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+METRICS_AGGREGATE\s+'
            r'Active_Threads:(\d+)\s+Pending_Tasks:(\d+)\s+CPU_Avg:([\d.]+)\s+'
            r'CPU_StdDev:([\d.]+)\s+CPU_Predicted:([\d.]+)'
        )

        try:
            with open(logfile, 'r') as f:
                for line in f:
                    line = line.strip()
                    if not line or line.startswith('==='):
                        continue
                    # Try aggregate first
                    agg_match = aggregate_pattern.match(line)
                    if agg_match:
                        ts = datetime.strptime(agg_match.group(1), '%Y-%m-%d %H:%M:%S')
                        # Store each numeric sub-metric as separate entries for easy charting
                        Metric.objects.create(metric_type='CPU_Usage', value=float(agg_match.group(4)), timestamp=ts)
                        Metric.objects.create(metric_type='Active_Threads', value=int(agg_match.group(2)), timestamp=ts)
                        Metric.objects.create(metric_type='Pending_Tasks', value=int(agg_match.group(3)), timestamp=ts)
                        Metric.objects.create(metric_type='CPU_StdDev', value=float(agg_match.group(5)), timestamp=ts)
                        Metric.objects.create(metric_type='CPU_Predicted', value=float(agg_match.group(6)), timestamp=ts)
                        count += 5
                        continue

                    # Normal metric lines
                    match = line_pattern.match(line)
                    if match:
                        ts = datetime.strptime(match.group(1), '%Y-%m-%d %H:%M:%S')
                        metric_type = match.group(2)
                        value_str = match.group(3).strip()
                        # Try to convert to float, else store as text
                        try:
                            val = float(value_str.replace('%', '').replace('MB', '').replace('GB', '').strip())
                            Metric.objects.create(metric_type=metric_type, value=val, timestamp=ts)
                        except ValueError:
                            Metric.objects.create(metric_type=metric_type, text_value=value_str, timestamp=ts)
                        count += 1
            self.stdout.write(f"Imported {count} metrics.")
        except FileNotFoundError:
            self.stderr.write(f"Log file {logfile} not found.")