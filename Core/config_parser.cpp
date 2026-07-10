// config_parser.cpp
// Cerberus Core Agent

#include "config_parser.h"
#include <fstream>
#include <sstream>
#include <algorithm>

using namespace std;

unordered_map<string, string> ConfigParser::parse(const string& filename) {
    unordered_map<string, string> config;
    ifstream file(filename);
    if (!file.is_open()) return config;

    string line;
    while (getline(file, line)) {
        // Remove comments (lines starting with #)
        size_t comment_pos = line.find('#');
        if (comment_pos != string::npos) {
            line = line.substr(0, comment_pos);
        }
        // Trim whitespace
        line.erase(0, line.find_first_not_of(" \t\r\n"));
        line.erase(line.find_last_not_of(" \t\r\n") + 1);
        if (line.empty()) continue;

        // Find '=' separator
        size_t eq_pos = line.find('=');
        if (eq_pos == string::npos) continue;

        string key = line.substr(0, eq_pos);
        string value = line.substr(eq_pos + 1);
        // Trim key and value
        key.erase(0, key.find_first_not_of(" \t"));
        key.erase(key.find_last_not_of(" \t") + 1);
        value.erase(0, value.find_first_not_of(" \t"));
        value.erase(value.find_last_not_of(" \t") + 1);

        config[key] = value;
    }
    return config;
}