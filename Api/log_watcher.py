import os, sys, time, re
from datetime import datetime

# Add the Django project to the path so we can use Django's ORM outside manage.py
sys.path.append(os.path.dirname(__file__))
os.environ.setdefault('DJANGO_SETTINGS_MODULE', 'cerberus_api.settings')
import django
django.setup()

from api.models import Metric

LOG_FILE = os.path.join(os.path.dirname(__file__), '..', 'Core', 'watchdog.log')
# Make path absolute
LOG_FILE = os.path.abspath(LOG_FILE)

# Patterns for parsing (same as management command)
line_pattern = re.compile(
    r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+([\w_]+):\s+(.*)'
)
aggregate_pattern = re.compile(
    r'\[(\d{4}-\d{2}-\d{2} \d{2}:\d{2}:\d{2})\]\s+METRICS_AGGREGATE\s+'
    r'Active_Threads:(\d+)\s+Pending_Tasks:(\d+)\s+CPU_Avg:([\d.]+)\s+'
    r'CPU_StdDev:([\d.]+)\s+CPU_Predicted:([\d.]+)'
)

def import_line(line):
    """Import a single log line into the database."""
    line = line.strip()
    if not line or line.startswith('==='):
        return

    # Try aggregate first
    agg_match = aggregate_pattern.match(line)
    if agg_match:
        ts = datetime.strptime(agg_match.group(1), '%Y-%m-%d %H:%M:%S')
        Metric.objects.create(metric_type='CPU_Usage', value=float(agg_match.group(4)), timestamp=ts)
        Metric.objects.create(metric_type='Active_Threads', value=int(agg_match.group(2)), timestamp=ts)
        Metric.objects.create(metric_type='Pending_Tasks', value=int(agg_match.group(3)), timestamp=ts)
        Metric.objects.create(metric_type='CPU_StdDev', value=float(agg_match.group(5)), timestamp=ts)
        Metric.objects.create(metric_type='CPU_Predicted', value=float(agg_match.group(6)), timestamp=ts)
        return

    # Normal metric line
    match = line_pattern.match(line)
    if match:
        ts = datetime.strptime(match.group(1), '%Y-%m-%d %H:%M:%S')
        metric_type = match.group(2)
        value_str = match.group(3).strip()
        try:
            val = float(value_str.replace('%','').replace('MB','').replace('GB','').strip())
            Metric.objects.create(metric_type=metric_type, value=val, timestamp=ts)
        except ValueError:
            Metric.objects.create(metric_type=metric_type, text_value=value_str, timestamp=ts)

def main():
    print(f"Watching {LOG_FILE} for new metrics...")
    # Determine where to start: read the last imported timestamp from DB
    last_imported = Metric.objects.order_by('-timestamp').first()
    if last_imported:
        last_timestamp = last_imported.timestamp
        print(f"Last DB entry at {last_timestamp}. Skipping older lines.")
    else:
        last_timestamp = datetime.min
        print("No existing metrics in DB. Importing all lines.")

    with open(LOG_FILE, 'r') as f:
        # Move to the end of file (ignore old lines already in DB unless they are newer than last_timestamp)
        # Actually, for simplicity, we can read the file from the beginning on first run, but skip lines older than last_timestamp.
        # For continuous operation, it's better to seek to end after initial load.
        if last_timestamp != datetime.min:
            # Seek to end to only process new lines
            f.seek(0, 2)  # end of file
        else:
            # Read all and import lines with timestamp > last_timestamp
            # But last_timestamp is min, so all lines will be imported
            pass

        while True:
            line = f.readline()
            if not line:
                # No new data, sleep and try again
                time.sleep(5)
                continue
            # Parse line timestamp and check if it's newer than last imported
            # We'll just attempt to import and rely on the line patterns; duplicates will be created though.
            # Better: check timestamp from line and skip if <= last_timestamp.
            # Quick approach: use regex to extract timestamp, compare.
            # For simplicity, we'll import everything new (since we seek to end after initial load, all lines are new).
            import_line(line)
            # Print for feedback
            print(f"Imported: {line.strip()}")

if __name__ == '__main__':
    main()