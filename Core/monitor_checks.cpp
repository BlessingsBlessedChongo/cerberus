// monitor_checks.cpp
// Implements real system checks using Win32 API

#define _CRT_SECURE_NO_WARNINGS
#include "monitor_checks.h"
#include <windows.h>
#include <psapi.h>
#include <sstream>
#include <iomanip>
#include <ctime>

#pragma comment(lib, "psapi.lib")

MonitorCheck::MonitorCheck(const std::string& name, std::chrono::seconds interval)
    : check_name(name), interval(interval) {
    last_run = std::chrono::steady_clock::now();
}

// ---------- CPU Check ----------
CPUCheck::CPUCheck()
    : MonitorCheck("CPU_Usage", std::chrono::seconds(10)),
      previous_total(0), previous_idle(0), first(true) {}

std::string CPUCheck::execute() {
    FILETIME idle_time, kernel_time, user_time;
    if (!GetSystemTimes(&idle_time, &kernel_time, &user_time)) {
        return "CPU_Usage: ERROR";
    }

    // Convert FILETIME to 64-bit integers
    auto to_uint64 = [](const FILETIME& ft) -> ULONGLONG {
        return ((ULONGLONG)ft.dwHighDateTime << 32) | ft.dwLowDateTime;
    };

    ULONGLONG idle = to_uint64(idle_time);
    ULONGLONG kernel = to_uint64(kernel_time);
    ULONGLONG user = to_uint64(user_time);
    ULONGLONG total = kernel + user;

    double cpu = 0.0;
    if (!first) {
        ULONGLONG delta_total = total - previous_total;
        ULONGLONG delta_idle = idle - previous_idle;
        if (delta_total > 0) {
            cpu = (1.0 - (double)delta_idle / delta_total) * 100.0;
        }
    }
    previous_total = total;
    previous_idle = idle;
    first = false;

    std::ostringstream oss;
    oss << "CPU_Usage: " << std::fixed << std::setprecision(1) << cpu << "%";
    return oss.str();
}

// ---------- Memory Check ----------
MemoryCheck::MemoryCheck()
    : MonitorCheck("Available_RAM", std::chrono::seconds(10)) {}

std::string MemoryCheck::execute() {
    MEMORYSTATUSEX mem;
    mem.dwLength = sizeof(mem);
    if (!GlobalMemoryStatusEx(&mem)) {
        return "Available_RAM: ERROR";
    }
    // Available physical memory in MB
    DWORDLONG avail_bytes = mem.ullAvailPhys;
    double avail_mb = (double)avail_bytes / (1024.0 * 1024.0);
    std::ostringstream oss;
    oss << "Available_RAM: " << std::fixed << std::setprecision(0) << avail_mb << " MB";
    return oss.str();
}

// ---------- Disk Check ----------
DiskCheck::DiskCheck()
    : MonitorCheck("Disk_Free_C", std::chrono::seconds(60)) {}

std::string DiskCheck::execute() {
    ULARGE_INTEGER free_bytes_available, total_bytes, total_free_bytes;
    if (!GetDiskFreeSpaceExA("C:\\", &free_bytes_available, &total_bytes, &total_free_bytes)) {
        return "Disk_Free_C: ERROR";
    }
    double free_gb = (double)free_bytes_available.QuadPart / (1024.0 * 1024.0 * 1024.0);
    std::ostringstream oss;
    oss << "Disk_Free_C: " << std::fixed << std::setprecision(2) << free_gb << " GB";
    return oss.str();
}

// ---------- Process Check ----------
ProcessCheck::ProcessCheck(const std::wstring& name)
    : MonitorCheck("Process_" + std::string(name.begin(), name.end()), std::chrono::seconds(15)),
      process_name(name) {}

std::string ProcessCheck::execute() {
    DWORD processes[1024], needed;
    if (!EnumProcesses(processes, sizeof(processes), &needed)) {
        return check_name + ": ERROR";
    }
    DWORD count = needed / sizeof(DWORD);
    bool found = false;
    for (DWORD i = 0; i < count; i++) {
        if (processes[i] == 0) continue;
        HANDLE hProcess = OpenProcess(PROCESS_QUERY_INFORMATION | PROCESS_VM_READ, FALSE, processes[i]);
        if (hProcess) {
            WCHAR name[MAX_PATH] = {0};
            HMODULE hMod;
            DWORD cbNeeded;
            if (EnumProcessModules(hProcess, &hMod, sizeof(hMod), &cbNeeded)) {
                GetModuleBaseNameW(hProcess, hMod, name, MAX_PATH);
                if (_wcsicmp(name, process_name.c_str()) == 0) {
                    found = true;
                    CloseHandle(hProcess);
                    break;
                }
            }
            CloseHandle(hProcess);
        }
    }
    std::string result = check_name + ": " + (found ? "Running" : "Not Found");
    return result;
}