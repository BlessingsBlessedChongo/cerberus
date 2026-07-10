package com.cerberus.analytics.controller;

import com.cerberus.analytics.service.AnalyticsService;
import org.springframework.web.bind.annotation.*;

import java.util.List;

@RestController
@RequestMapping("/analytics")
public class AnalyticsController {

    private final AnalyticsService service;

    public AnalyticsController(AnalyticsService service) {
        this.service = service;
    }

    @GetMapping("/trend")
    public AnalyticsService.TrendData getTrend(
            @RequestParam(defaultValue = "CPU_Usage") String metric,
            @RequestParam(defaultValue = "7") int days) {
        return service.getTrend(metric, days);
    }

    @GetMapping("/anomalies")
    public List<AnalyticsService.Anomaly> getAnomalies(
            @RequestParam(defaultValue = "CPU_Usage") String metric,
            @RequestParam(defaultValue = "7") int days) {
        return service.getAnomalies(metric, days);
    }

    @GetMapping("/types")
    public List<String> getMetricTypes() {
        return service.getMetricTypes();
    }
}