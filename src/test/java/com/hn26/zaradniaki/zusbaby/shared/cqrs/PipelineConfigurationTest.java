package com.hn26.zaradniaki.zusbaby.shared.cqrs;

import static org.assertj.core.api.Assertions.assertThat;
import static org.assertj.core.api.Assertions.assertThatThrownBy;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.Notification;
import an.awesome.pipelinr.Pipeline;
import jakarta.validation.ConstraintViolationException;
import jakarta.validation.constraints.NotBlank;
import java.util.ArrayList;
import java.util.List;
import java.util.concurrent.CopyOnWriteArrayList;
import org.junit.jupiter.api.Test;
import org.springframework.boot.test.context.runner.ApplicationContextRunner;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;
import org.springframework.context.annotation.EnableAspectJAutoProxy;
import org.springframework.core.annotation.Order;
import org.springframework.transaction.TransactionDefinition;
import org.springframework.transaction.annotation.EnableTransactionManagement;
import org.springframework.transaction.annotation.Transactional;
import org.springframework.transaction.support.AbstractPlatformTransactionManager;
import org.springframework.transaction.support.DefaultTransactionStatus;
import org.springframework.validation.beanvalidation.LocalValidatorFactoryBean;

class PipelineConfigurationTest {

    private final ApplicationContextRunner context = new ApplicationContextRunner().withUserConfiguration(
            PipelineConfiguration.class, LoggingMiddleware.class, ValidationMiddleware.class, TestBeans.class);

    @Test
    void routesCommandToItsTransactionalHandler() {
        context.run(ctx -> {
            String result = ctx.getBean(Pipeline.class).send(new RegisterName("Zosia"));

            assertThat(result).isEqualTo("registered Zosia");
            assertThat(ctx.getBean(RecordingTransactionManager.class).readOnlyFlags).containsExactly(false);
        });
    }

    @Test
    void runsQueryInReadOnlyTransaction() {
        context.run(ctx -> {
            Integer result = ctx.getBean(Pipeline.class).send(new CountNames());

            assertThat(result).isEqualTo(2);
            assertThat(ctx.getBean(RecordingTransactionManager.class).readOnlyFlags).containsExactly(true);
        });
    }

    @Test
    void rejectsInvalidCommandBeforeHandlerRuns() {
        context.run(ctx -> {
            Pipeline pipeline = ctx.getBean(Pipeline.class);

            assertThatThrownBy(() -> pipeline.send(new RegisterName(" ")))
                    .isInstanceOf(ConstraintViolationException.class).hasMessageContaining("name");
            assertThat(ctx.getBean(RegisterNameHandler.class).calls).isZero();
            assertThat(ctx.getBean(RecordingTransactionManager.class).readOnlyFlags).isEmpty();
        });
    }

    @Test
    void runsMiddlewaresInOrderAroundHandler() {
        context.run(ctx -> {
            ctx.getBean(Pipeline.class).send(new CountNames());

            assertThat(ctx.getBean("trace", List.class)).containsExactly("first:before", "second:before",
                    "second:after", "first:after");
        });
    }

    @Test
    void deliversNotificationsToHandlers() {
        context.run(ctx -> {
            ctx.getBean(Pipeline.class).send(new NameRegistered("Zosia"));

            assertThat(ctx.getBean(NameRegisteredHandler.class).received).containsExactly("Zosia");
        });
    }

    record RegisterName(@NotBlank String name) implements Command<String> {
    }

    record CountNames() implements Command<Integer> {
    }

    record NameRegistered(String name) implements Notification {
    }

    static class RegisterNameHandler implements Command.Handler<RegisterName, String> {
        int calls;

        @Override
        @Transactional
        public String handle(RegisterName command) {
            calls++;
            return "registered " + command.name();
        }
    }

    static class CountNamesHandler implements Command.Handler<CountNames, Integer> {
        @Override
        @Transactional(readOnly = true)
        public Integer handle(CountNames query) {
            return 2;
        }
    }

    static class NameRegisteredHandler implements Notification.Handler<NameRegistered> {
        final List<String> received = new ArrayList<>();

        @Override
        public void handle(NameRegistered notification) {
            received.add(notification.name());
        }
    }

    record TracingMiddleware(String name, List<String> trace) implements Command.Middleware {
        @Override
        public <R, C extends Command<R>> R invoke(C command, Next<R> next) {
            trace.add(name + ":before");
            R result = next.invoke();
            trace.add(name + ":after");
            return result;
        }
    }

    /** Records whether each transaction was read-only. */
    static class RecordingTransactionManager extends AbstractPlatformTransactionManager {
        final List<Boolean> readOnlyFlags = new CopyOnWriteArrayList<>();

        @Override
        protected Object doGetTransaction() {
            return new Object();
        }

        @Override
        protected void doBegin(Object transaction, TransactionDefinition definition) {
            readOnlyFlags.add(definition.isReadOnly());
        }

        @Override
        protected void doCommit(DefaultTransactionStatus status) {
        }

        @Override
        protected void doRollback(DefaultTransactionStatus status) {
        }
    }

    @Configuration(proxyBeanMethods = false)
    @EnableTransactionManagement(proxyTargetClass = true)
    @EnableAspectJAutoProxy(proxyTargetClass = true)
    static class TestBeans {

        @Bean
        LocalValidatorFactoryBean validator() {
            return new LocalValidatorFactoryBean();
        }

        @Bean
        RecordingTransactionManager transactionManager() {
            return new RecordingTransactionManager();
        }

        @Bean
        RegisterNameHandler registerNameHandler() {
            return new RegisterNameHandler();
        }

        @Bean
        CountNamesHandler countNamesHandler() {
            return new CountNamesHandler();
        }

        @Bean
        NameRegisteredHandler nameRegisteredHandler() {
            return new NameRegisteredHandler();
        }

        @Bean
        List<String> trace() {
            return new CopyOnWriteArrayList<>();
        }

        @Bean
        @Order(2)
        TracingMiddleware secondMiddleware(List<String> trace) {
            return new TracingMiddleware("second", trace);
        }

        @Bean
        @Order(1)
        TracingMiddleware firstMiddleware(List<String> trace) {
            return new TracingMiddleware("first", trace);
        }
    }
}
