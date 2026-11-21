package com.hn26.zaradniaki.zusbaby.shared.cqrs;

import an.awesome.pipelinr.Command;
import lombok.extern.slf4j.Slf4j;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Logs the command type and duration. Never logs the command itself: commands
 * may carry personal or health data.
 */
@Slf4j
@Component
@Order(Ordered.HIGHEST_PRECEDENCE)
class LoggingMiddleware implements Command.Middleware {

    @Override
    public <R, C extends Command<R>> R invoke(C command, Next<R> next) {
        String name = command.getClass().getSimpleName();
        long start = System.nanoTime();
        try {
            R result = next.invoke();
            log.debug("{} handled in {} ms", name, elapsedMillis(start));
            return result;
        } catch (RuntimeException ex) {
            log.info("{} failed after {} ms: {}", name, elapsedMillis(start), ex.getClass().getSimpleName());
            throw ex;
        }
    }

    private static long elapsedMillis(long start) {
        return (System.nanoTime() - start) / 1_000_000;
    }
}
