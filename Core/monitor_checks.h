// monitor_checks.h
// CS 350: OOP – Base class for all monitoring checks

#ifndef MONITOR_CHECKS_H
#define MONITOR_CHECKS_H

#include <string>
#include <chrono>
#include <atomic>
#include <vector>
#include <functional>

// Base class for a single monitoring check (CS 350: Inheritance)
class MonitorCheck {
protected:
    std::string check_name;
    std::chrono::seconds interval;
    std::chrono::steady_clock::time_point last_run;

public:
    MonitorCheck(const std::string& name, std::chrono::seconds interval);
    virtual ~MonitorCheck() = default;

    // Run the check and return a log line (e.g. "CPU_Usage: 45.2% | Available_RAM: 1234 MB")
    virtual std::string execute() = 0;

    std::string get_name() const { return check_name; }
    std::chrono::seconds get_interval() const { return interval; }
    std::chrono::steady_clock::time_point get_last_run() const { return last_run; }
    void set_last_run(std::chrono::steady_clock::time_point t) { last_run = t; }
};

// Concrete check: CPU usage (CS 350: Derived class)
class CPUCheck : public MonitorCheck {
private:
    double previous_total;
    double previous_idle;
    bool first;

public:
    CPUCheck();
    std::string execute() override;
};

// Concrete check: Available RAM
class MemoryCheck : public MonitorCheck {
public:
    MemoryCheck();
    std::string execute() override;
};

// Concrete check: Free disk space on C:
class DiskCheck : public MonitorCheck {
public:
    DiskCheck();
    std::string execute() override;
};

// Concrete check: is a specific process running?
class ProcessCheck : public MonitorCheck {
private:
    std::wstring process_name;
public:
    ProcessCheck(const std::wstring& name);
    std::string execute() override;
};

#endif // MONITOR_CHECKS_H