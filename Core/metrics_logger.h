// metrics_logger.h
#ifndef METRICS_LOGGER_H
#define METRICS_LOGGER_H
#include <vector>
#include <string>
#include <fstream>
#include <mutex>
#include <chrono>

class MetricsLogger {
public:
    MetricsLogger(const std::string& log_filename);
    ~MetricsLogger();
    void log_check_result(const std::string& line);
    void log_aggregate(int active_threads, int pending_tasks);
    // Numerical analysis methods
    double get_cpu_mean();
    double get_cpu_stddev();
    double predict_cpu_next();   // linear regression on CPU history
private:
    std::ofstream log_file;
    std::string log_path;
    std::mutex data_mutex;
    std::vector<double> cpu_history; // stored CPU percentages
    double calculate_mean(const std::vector<double>& data);
    double calculate_stddev(const std::vector<double>& data);
    double calculate_slope(const std::vector<double>& x, const std::vector<double>& y);
    void trim_history(size_t max_samples);
};
#endif