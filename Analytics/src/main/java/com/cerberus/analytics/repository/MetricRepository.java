package com.cerberus.analytics.repository;

import com.cerberus.analytics.entity.MetricRecord;
import org.springframework.data.jpa.repository.JpaRepository;
import org.springframework.data.jpa.repository.Query;
import org.springframework.data.repository.query.Param;
import java.time.LocalDateTime;
import java.util.List;

public interface MetricRepository extends JpaRepository<MetricRecord, Long> {

    // Find all records of a given metric type within a time range
    @Query("SELECT m FROM MetricRecord m WHERE m.metricType = :type " +
           "AND m.timestamp >= :since ORDER BY m.timestamp ASC")
    List<MetricRecord> findByTypeSince(@Param("type") String type,
                                       @Param("since") LocalDateTime since);

    // Find all distinct metric types
    @Query("SELECT DISTINCT m.metricType FROM MetricRecord m")
    List<String> findDistinctMetricTypes();
}