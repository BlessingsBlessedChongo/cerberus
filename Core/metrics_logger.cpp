// metrics_logger.cpp
#include "metrics_logger.h"
#include <sstream>
#include <iomanip>
#include <cmath>
#include <ctime>
#include <algorithm>

MetricsLogger::MetricsLogger(const std::string& log_filename) : log_path(log_filename) {
    log_file.open(log_filename, std::ios::app);
    if (log_file.is_open()) {
        log_file << "=== CERBERUS CORE LOG ===\n";
        log_file << "Timestamp,Check,Value\n";
    }
}

MetricsLogger::~MetricsLogger() {
    if (log_file.is_open()) log_file.close();
}

void MetricsLogger::log_check_result(const std::string& line) {
    std::lock_guard<std::mutex> lock(data_mutex);
    auto now = std::chrono::system_clock::now();
    std::time_t t = std::chrono::system_clock::to_time_t(now);
    struct tm timeinfo;
    localtime_s(&timeinfo, &t);
    char stamp[64];
    strftime(stamp, sizeof(stamp), "%Y-%m-%d %H:%M:%S", &timeinfo);
    if (log_file.is_open()) {
        log_file << "[" << stamp << "] " << line << "\n";
        log_file.flush();
    }
    // Extract CPU value if present and store
    if (line.find("CPU_Usage:") != std::string::npos) {
        size_t pos = line.find(":");
        if (pos != std::string::npos) {
            std::string val_str = line.substr(pos + 1);
            // remove '%' and spaces
            val_str.erase(std::remove_if(val_str.begin(), val_str.end(), [](char c){ return c == '%' || c == ' '; }), val_str.end());
            try {
                double cpu = std::stod(val_str);
                cpu_history.push_back(cpu);
                trim_history(100);
            } catch (...) {}
        }
    }
}

void MetricsLogger::log_aggregate(int active_threads, int pending_tasks) {
    std::lock_guard<std::mutex> lock(data_mutex);
    auto now = std::chrono::system_clock::now();
    std::time_t t = std::chrono::system_clock::to_time_t(now);
    struct tm timeinfo;
    localtime_s(&timeinfo, &t);
    char stamp[64];
    strftime(stamp, sizeof(stamp), "%Y-%m-%d %H:%M:%S", &timeinfo);
    double avg_cpu = calculate_mean(cpu_history);
    double stddev_cpu = calculate_stddev(cpu_history);
    double next_cpu = predict_cpu_next();
    if (log_file.is_open()) {
        log_file << "[" << stamp << "] METRICS_AGGREGATE "
                 << "Active_Threads:" << active_threads
                 << " Pending_Tasks:" << pending_tasks
                 << " CPU_Avg:" << std::fixed << std::setprecision(1) << avg_cpu
                 << " CPU_StdDev:" << stddev_cpu
                 << " CPU_Predicted:" << next_cpu << "\n";
        log_file.flush();
    }
}

double MetricsLogger::calculate_mean(const std::vector<double>& data) {
    if (data.empty()) return 0.0;
    double sum = 0.0;
    for (double v : data) sum += v;
    return sum / data.size();
}

double MetricsLogger::calculate_stddev(const std::vector<double>& data) {
    if (data.size() < 2) return 0.0;
    double mean = calculate_mean(data);
    double sq_sum = 0.0;
    for (double v : data) sq_sum += (v - mean) * (v - mean);
    return std::sqrt(sq_sum / (data.size() - 1));
}

double MetricsLogger::calculate_slope(const std::vector<double>& x, const std::vector<double>& y) {
    if (x.size() != y.size() || x.size() < 2) return 0.0;
    double x_mean = calculate_mean(x);
    double y_mean = calculate_mean(y);
    double num = 0.0, den = 0.0;
    for (size_t i = 0; i < x.size(); i++) {
        double dx = x[i] - x_mean;
        num += dx * (y[i] - y_mean);
        den += dx * dx;
    }
    return (den != 0.0) ? (num / den) : 0.0;
}

double MetricsLogger::predict_cpu_next() {
    if (cpu_history.size() < 10) return calculate_mean(cpu_history);
    std::vector<double> x(cpu_history.size());
    for (size_t i = 0; i < cpu_history.size(); i++) x[i] = static_cast<double>(i);
    double slope = calculate_slope(x, cpu_history);
    double intercept = calculate_mean(cpu_history) - slope * calculate_mean(x);
    return slope * cpu_history.size() + intercept;
}

void MetricsLogger::trim_history(size_t max_samples) {
    if (cpu_history.size() > max_samples) {
        cpu_history.erase(cpu_history.begin(), cpu_history.end() - max_samples);
    }
}