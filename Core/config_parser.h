// config_parser.h
// CS 345: Compiler Construction – simple configuration file parser
// Cerberus Core Agent

#ifndef CONFIG_PARSER_H
#define CONFIG_PARSER_H

#include <string>
#include <vector>
#include <unordered_map>

using namespace std;

struct ConfigEntry {
    string key;
    string value;
};

class ConfigParser {
public:
    ConfigParser() {}
    unordered_map<string, string> parse(const string& filename);
};

#endif