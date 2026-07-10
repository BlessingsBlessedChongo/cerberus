// main.cpp
// Cerberus Core Agent – multi-threaded system monitor

#define _CRT_SECURE_NO_WARNINGS
#include <iostream>
#include <thread>
#include <atomic>
#include <csignal>
#include <windows.h>
#include "thread_pool.h"
#include "metrics_logger.h"
#include "monitor_checks.h"

std::atomic<bool> running(true);

void signal_handler(int sig) {
    running = false;
}

int main() {
    std::cout << "=== CERBERUS CORE AGENT STARTING ===\n";
    std::signal(SIGINT, signal_handler);
    std::signal(SIGTERM, signal_handler);

    MetricsLogger logger("watchdog.log");

    // Create monitoring checks (you can add more, like a service check)
    std::vector<std::unique_ptr<MonitorCheck>> checks;
    checks.push_back(std::make_unique<CPUCheck>());
    checks.push_back(std::make_unique<MemoryCheck>());
    checks.push_back(std::make_unique<DiskCheck>());
    // Example: check if notepad is running (for testing)
    // checks.push_back(std::make_unique<ProcessCheck>(L"notepad.exe"));

    ThreadPool pool(4);  // CS 320: thread pool with 4 workers

    std::cout << "[Core] Thread pool and checks ready. Monitoring every 10s.\n";
    std::cout << "[Core] Logging to watchdog.log. Press Ctrl+C to stop.\n";

    // Periodic aggregation thread (for numerical metrics)
    std::thread aggregator([&]() {
        while (running) {
            std::this_thread::sleep_for(std::chrono::seconds(10));
            if (!running) break;
            logger.log_aggregate(pool.get_active_threads(), static_cast<int>(pool.get_pending_tasks()));
        }
    });

    // Main monitoring loop
    while (running) {
        for (auto& check : checks) {
            auto now = std::chrono::steady_clock::now();
            if (now - check->get_last_run() >= check->get_interval()) {
                check->set_last_run(now);
                // Enqueue check execution to thread pool
                pool.enqueue([&logger, &check]() {
                    std::string result = check->execute();
                    logger.log_check_result(result);
                    // Optional: print to console for immediate feedback
                    std::cout << result << std::endl;
                });
            }
        }
        std::this_thread::sleep_for(std::chrono::milliseconds(500));
    }

    std::cout << "\n[Core] Shutting down...\n";
    running = false;
    if (aggregator.joinable()) aggregator.join();
    // ThreadPool destructor joins workers
    std::cout << "[Core] Cerberus Core Agent stopped. Log saved.\n";
    return 0;
}