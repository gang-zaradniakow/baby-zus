package com.hn26.zaradniaki.zusbaby.shared.cqrs;

import an.awesome.pipelinr.Command;
import jakarta.validation.ConstraintViolation;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.Validator;
import java.util.Set;
import lombok.RequiredArgsConstructor;
import org.springframework.core.Ordered;
import org.springframework.core.annotation.Order;
import org.springframework.stereotype.Component;

/**
 * Validates Bean Validation constraints declared on command and query records
 * before the handler runs. A violation becomes
 * {@link ConstraintViolationException} (mapped to 400 with a gentle message).
 */
@Component
@Order(Ordered.HIGHEST_PRECEDENCE + 10)
@RequiredArgsConstructor
class ValidationMiddleware implements Command.Middleware {

    private final Validator validator;

    @Override
    public <R, C extends Command<R>> R invoke(C command, Next<R> next) {
        Set<ConstraintViolation<C>> violations = validator.validate(command);
        if (!violations.isEmpty()) {
            throw new ConstraintViolationException(violations);
        }
        return next.invoke();
    }
}
