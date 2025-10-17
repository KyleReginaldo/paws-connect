// Performance monitoring utilities for chat and forum APIs
interface PerformanceMetric {
  operation: string;
  duration: number;
  timestamp: Date;
  metadata?: Record<string, unknown>;
}

class PerformanceMonitor {
  private metrics: PerformanceMetric[] = [];
  private maxMetrics = 1000; // Keep only last 1000 metrics

  startTimer(operation: string, metadata?: Record<string, unknown>) {
    const start = performance.now();
    return {
      end: () => {
        const duration = performance.now() - start;
        this.addMetric({
          operation,
          duration,
          timestamp: new Date(),
          metadata
        });
        return duration;
      }
    };
  }

  private addMetric(metric: PerformanceMetric) {
    this.metrics.push(metric);
    if (this.metrics.length > this.maxMetrics) {
      this.metrics.shift();
    }
    
    // Log slow operations (> 1 second)
    if (metric.duration > 1000) {
      console.warn(`🐌 Slow operation detected: ${metric.operation} took ${metric.duration.toFixed(2)}ms`, metric.metadata);
    }
  }

  getMetrics(operation?: string) {
    if (operation) {
      return this.metrics.filter(m => m.operation === operation);
    }
    return this.metrics;
  }

  getAverageTime(operation: string, lastN = 10) {
    const recent = this.getMetrics(operation).slice(-lastN);
    if (recent.length === 0) return 0;
    return recent.reduce((sum, m) => sum + m.duration, 0) / recent.length;
  }

  getSlowestOperations(limit = 10) {
    return [...this.metrics]
      .sort((a, b) => b.duration - a.duration)
      .slice(0, limit);
  }
}

export const performanceMonitor = new PerformanceMonitor();

// Usage example:
// const timer = performanceMonitor.startTimer('fetch_chat_messages', { forumId: 123, limit: 20 });
// // ... do work ...
// const duration = timer.end();
// console.log(`Operation took ${duration}ms`);