// sentinel.c
// Cerberus Sentinel – CRC32-based log integrity verifier
// CS 270: Digital logic applied to file verification

#define _CRT_SECURE_NO_WARNINGS

#include <stdio.h>
#include <stdint.h>
#include <stdlib.h>
#include <string.h>
#include <time.h>
#include <windows.h>
#include <tlhelp32.h>  // <-- FIX 1: Required for process snapshot APIs

static uint32_t crc32_table[256];
static int table_initialized = 0;

// Build CRC32 lookup table (polynomial 0xEDB88320)
void init_crc32_table(void) {
    uint32_t polynomial = 0xEDB88320;
    for (uint32_t i = 0; i < 256; i++) {
        uint32_t crc = i;
        for (int j = 0; j < 8; j++) {
            crc = (crc >> 1) ^ ((crc & 1) ? polynomial : 0);
        }
        crc32_table[i] = crc;
    }
    table_initialized = 1;
}

// Compute CRC32 of a file
uint32_t file_crc32(const char* filename) {
    if (!table_initialized) init_crc32_table();

    FILE* f = fopen(filename, "rb");
    if (!f) {
        printf("ERROR: Cannot open file %s\n", filename);
        return 0;
    }

    uint32_t crc = 0xFFFFFFFF;
    int byte;
    while ((byte = fgetc(f)) != EOF) {
        crc = (crc >> 8) ^ crc32_table[(crc ^ byte) & 0xFF];
    }
    fclose(f);
    return crc ^ 0xFFFFFFFF;
}

// Write alert to sentinel_alerts.log
void write_alert(const char* message) {
    FILE* alert_file = fopen("sentinel_alerts.log", "a");
    if (!alert_file) return;

    time_t now = time(NULL);
    struct tm timeinfo;
    localtime_s(&timeinfo, &now);
    char timestamp[64];
    strftime(timestamp, sizeof(timestamp), "%Y-%m-%d %H:%M:%S", &timeinfo);

    fprintf(alert_file, "[%s] %s\n", timestamp, message);
    fclose(alert_file);
    printf("%s\n", message);
}

// Terminate the Core agent process
void kill_core_agent(void) {
    // Find and terminate cerberus-core.exe
    HANDLE hSnapshot = CreateToolhelp32Snapshot(TH32CS_SNAPPROCESS, 0);
    if (hSnapshot == INVALID_HANDLE_VALUE) return;

    PROCESSENTRY32 pe;
    pe.dwSize = sizeof(PROCESSENTRY32);

    if (Process32First(hSnapshot, &pe)) {
        do {
            // FIX 2: Changed from _wcsicmp / wide-string to narrow _stricmp
            if (_stricmp(pe.szExeFile, "cerberus-core.exe") == 0) {
                HANDLE hProcess = OpenProcess(PROCESS_TERMINATE, FALSE, pe.th32ProcessID);
                if (hProcess) {
                    TerminateProcess(hProcess, 1);
                    CloseHandle(hProcess);
                    printf("Terminated cerberus-core.exe (PID %d)\n", pe.th32ProcessID);
                }
            }
        } while (Process32Next(hSnapshot, &pe));
    }
    CloseHandle(hSnapshot);
}

int main(int argc, char* argv[]) {
    const char* log_file = "watchdog.log";
    const char* checksum_file = "watchdog.checksum";

    // If a path is provided, use it; otherwise assume current directory
    if (argc >= 2) log_file = argv[1];
    if (argc >= 3) checksum_file = argv[2];

    printf("Cerberus Sentinel – Checking integrity of %s\n", log_file);

    uint32_t current_crc = file_crc32(log_file);
    if (current_crc == 0) {
        write_alert("ERROR: Could not compute checksum. Log file may be missing.");
        return 1;
    }

    // Read stored checksum
    uint32_t stored_crc = 0;
    FILE* checksum_fp = fopen(checksum_file, "r");
    if (checksum_fp) {
        fscanf_s(checksum_fp, "%x", &stored_crc);
        fclose(checksum_fp);
    } else {
        printf("No stored checksum found. Creating new one.\n");
    }

    // Compare
    if (stored_crc != 0 && current_crc != stored_crc) {
        char alert_msg[256];
        snprintf(alert_msg, sizeof(alert_msg),
                 "ALERT: Log file tampered! Current CRC: %08X, Stored CRC: %08X",
                 current_crc, stored_crc);
        write_alert(alert_msg);
        kill_core_agent();  // optional: comment out if you only want alerts
    } else {
        printf("Integrity OK (CRC: %08X)\n", current_crc);
    }

    // Update stored checksum
    checksum_fp = fopen(checksum_file, "w");
    if (checksum_fp) {
        fprintf(checksum_fp, "%08X\n", current_crc);
        fclose(checksum_fp);
    }

    return 0;
}