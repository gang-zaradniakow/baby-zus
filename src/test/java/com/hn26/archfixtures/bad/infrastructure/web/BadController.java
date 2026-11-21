package com.hn26.archfixtures.bad.infrastructure.web;

import com.hn26.archfixtures.bad.application.command.MutableCommand;
import com.hn26.archfixtures.bad.application.command.MutableCommandHandler;
import org.springframework.web.bind.annotation.RestController;

/** Violation: controller calls a handler directly instead of the Pipeline. */
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
