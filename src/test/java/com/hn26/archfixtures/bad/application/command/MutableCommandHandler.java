package com.hn26.archfixtures.bad.application.command;

import an.awesome.pipelinr.Command;

/** Violation: command handler without @Transactional. */
public class MutableCommandHandler implements Command.Handler<MutableCommand, String> {

    @Override
    public String handle(MutableCommand command) {
        return "";
    }
}
