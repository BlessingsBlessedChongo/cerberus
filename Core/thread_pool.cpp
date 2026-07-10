// thread_pool.cpp
#include "thread_pool.h"
#include <iostream>

ThreadPool::ThreadPool(size_t num_threads) : stop(false), active_threads(0), total_tasks(0) {
    for (size_t i = 0; i < num_threads; ++i) {
        workers.emplace_back([this, i]() {
            while (true) {
                std::function<void()> task;
                {
                    std::unique_lock<std::mutex> lock(this->queue_mutex);
                    this->condition.wait(lock, [this]() {
                        return this->stop.load() || !this->tasks.empty();
                    });
                    if (this->stop.load() && this->tasks.empty())
                        return;
                    task = std::move(this->tasks.front());
                    this->tasks.pop();
                }
                active_threads++;
                task();
                active_threads--;
                total_tasks++;
            }
        });
    }
}

ThreadPool::~ThreadPool() {
    {
        std::lock_guard<std::mutex> lock(queue_mutex);
        stop = true;
    }
    condition.notify_all();
    for (std::thread& worker : workers) {
        if (worker.joinable()) worker.join();
    }
}

void ThreadPool::enqueue(std::function<void()> task) {
    {
        std::lock_guard<std::mutex> lock(queue_mutex);
        if (stop.load()) return;
        tasks.push(std::move(task));
    }
    condition.notify_one();
}

size_t ThreadPool::get_pending_tasks() {
    std::lock_guard<std::mutex> lock(queue_mutex);
    return tasks.size();
}