package com.hn26.zaradniaki.zusbaby.shared.cqrs;

import an.awesome.pipelinr.Command;
import an.awesome.pipelinr.CommandHandlers;
import an.awesome.pipelinr.Notification;
import an.awesome.pipelinr.NotificationHandlers;
import an.awesome.pipelinr.Pipeline;
import an.awesome.pipelinr.Pipelinr;
import org.springframework.beans.factory.ObjectProvider;
import org.springframework.context.annotation.Bean;
import org.springframework.context.annotation.Configuration;

/**
 * CQRS bus. Commands and queries are records implementing {@link Command};
 * their handlers are Spring beans found here automatically. Middlewares run in
 * {@code @Order} order, the first one wraps all the others.
 * <p>
 * Conventions (checked by ArchUnit): commands and their handlers live in
 * {@code application.command} and handle {@code @Transactional}, queries live
 * in {@code application.query} and handle
 * {@code @Transactional(readOnly = true)}.
 */
@Configuration(proxyBeanMethods = false)
public class PipelineConfiguration {

    @Bean
    Pipeline pipeline(ObjectProvider<Command.Handler> commandHandlers,
            ObjectProvider<Command.Middleware> commandMiddlewares,
            ObjectProvider<Notification.Handler> notificationHandlers,
            ObjectProvider<Notification.Middleware> notificationMiddlewares) {
        CommandHandlers handlers = commandHandlers::stream;
        Command.Middlewares middlewares = commandMiddlewares::orderedStream;
        NotificationHandlers notifications = notificationHandlers::stream;
        Notification.Middlewares notificationChain = notificationMiddlewares::orderedStream;
        return new Pipelinr().with(handlers).with(middlewares).with(notifications).with(notificationChain);
    }
}
