package com.cerberus.analytics.service;

import com.cerberus.analytics.entity.MetricRecord;
import com.cerberus.analytics.repository.MetricRepository;
import org.springframework.stereotype.Service;

import java.time.LocalDateTime;
import java.util.ArrayList;
import java.util.Collections;
import java.util.List;
import java.util.stream.Collectors;

@Service
public class AnalyticsService {

    private final MetricRepository repository;

    public AnalyticsService(MetricRepository repository) {
        this.repository = repository;
    }

    // Mean
    public double calculateMean(List<Double> values) {
        if (values.isEmpty()) return 0.0;
        double sum = 0.0;
        for (double v : values) sum += v;
        return sum / values.size();
    }

    // Standard deviation (sample)
    public double calculateStdDev(List<Double> values) {
        if (values.size() < 2) return 0.0;
        double mean = calculateMean(values);
        double sqDiffSum = 0.0;
        for (double v : values) sqDiffSum += (v - mean) * (v - mean);
        return Math.sqrt(sqDiffSum / (values.size() - 1));
    }

    // Simple linear regression slope
    public double calculateSlope(List<Double> x, List<Double> y) {
        if (x.size() != y.size() || x.size() < 2) return 0.0;
        double xMean = calculateMean(x);
        double yMean = calculateMean(y);
        double num = 0.0, den = 0.0;
        for (int i = 0; i < x.size(); i++) {
            double dx = x.get(i) - xMean;
            num += dx * (y.get(i) - yMean);
            den += dx * dx;
        }
        return (den != 0.0) ? num / den : 0.0;
    }

    // Predict next value using linear regression
    public double predictNext(List<Double> values) {
        if (values.size() < 10) return calculateMean(values);
        List<Double> x = new ArrayList<>();
        for (int i = 0; i < values.size(); i++) x.add((double) i);
        double slope = calculateSlope(x, values);
        double intercept = calculateMean(values) - slope * calculateMean(x);
        return slope * values.size() + intercept;
    }

    // Find anomalies (points outside 2 standard deviations from mean)
    public List<Anomaly> findAnomalies(List<MetricRecord> records) {
        List<Double> values = records.stream()
                .filter(r -> r.getValue() != null)
                .map(MetricRecord::getValue)
                .collect(Collectors.toList());
        if (values.size() < 10) return Collections.emptyList();
        double mean = calculateMean(values);
        double stdDev = calculateStdDev(values);
        double thresholdLow = mean - 2 * stdDev;
        double thresholdHigh = mean + 2 * stdDev;

        List<Anomaly> anomalies = new ArrayList<>();
        for (MetricRecord r : records) {
            if (r.getValue() != null) {
                double v = r.getValue();
                if (v < thresholdLow || v > thresholdHigh) {
                    anomalies.add(new Anomaly(r.getTimestamp(), v, mean, stdDev));
                }
            }
        }
        return anomalies;
    }

    // Data transfer object for trend response
    public static class TrendData {
        public double mean;
        public double stdDev;
        public double predictedNext;
        public List<Double> movingAverage; // 10-point simple moving average
        public List<DataPoint> dataPoints;

        public TrendData(double mean, double stdDev, double predictedNext,
                         List<Double> movingAverage, List<DataPoint> dataPoints) {
            this.mean = mean;
            this.stdDev = stdDev;
            this.predictedNext = predictedNext;
            this.movingAverage = movingAverage;
            this.dataPoints = dataPoints;
        }
    }

    public static class DataPoint {
        public LocalDateTime timestamp;
        public double value;
        public DataPoint(LocalDateTime timestamp, double value) {
            this.timestamp = timestamp;
            this.value = value;
        }
    }

    public static class Anomaly {
        public LocalDateTime timestamp;
        public double value;
        public double mean;
        public double stdDev;
        public Anomaly(LocalDateTime timestamp, double value, double mean, double stdDev) {
            this.timestamp = timestamp;
            this.value = value;
            this.mean = mean;
            this.stdDev = stdDev;
        }
    }

    // Build trend data for a metric type over the last N days
    public TrendData getTrend(String metricType, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<MetricRecord> records = repository.findByTypeSince(metricType, since);
        List<Double> values = records.stream()
                .filter(r -> r.getValue() != null)
                .map(MetricRecord::getValue)
                .collect(Collectors.toList());

        double mean = calculateMean(values);
        double stdDev = calculateStdDev(values);
        double predictedNext = predictNext(values);

        // 10-point simple moving average (on the last portion)
        List<Double> movingAvg = new ArrayList<>();
        int window = 10;
        for (int i = 0; i < values.size(); i++) {
            if (i >= window - 1) {
                double sum = 0.0;
                for (int j = i - window + 1; j <= i; j++) sum += values.get(j);
                movingAvg.add(sum / window);
            }
        }

        List<DataPoint> dataPoints = new ArrayList<>();
        for (MetricRecord r : records) {
            if (r.getValue() != null) {
                dataPoints.add(new DataPoint(r.getTimestamp(), r.getValue()));
            }
        }

        return new TrendData(mean, stdDev, predictedNext, movingAvg, dataPoints);
    }

    public List<Anomaly> getAnomalies(String metricType, int days) {
        LocalDateTime since = LocalDateTime.now().minusDays(days);
        List<MetricRecord> records = repository.findByTypeSince(metricType, since);
        return findAnomalies(records);
    }

    public List<String> getMetricTypes() {
        return repository.findDistinctMetricTypes();
    }
}