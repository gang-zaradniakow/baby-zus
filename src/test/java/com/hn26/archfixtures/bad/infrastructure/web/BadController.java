package com.hn26.archfixtures.bad.infrastructure.web;

import com.hn26.archfixtures.bad.application.command.MutableCommand;
import com.hn26.archfixtures.bad.application.command.MutableCommandHandler;
import org.springframework.web.bind.annotation.RestController;

/**
 * Violations: controller calls a handler directly instead of the Pipeline and
 * does not implement a generated *Api.
 */
@RestController
class BadController {

    private final MutableCommandHandler handler;

    BadController(MutableCommandHandler handler) {
        this.handler = handler;
    }

    String run() {
        return handler.handle(new MutableCommand());
    }
}
