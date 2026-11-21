package com.hn26.archfixtures.bad.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.archfixtures.bad.application.command.MutableCommand;

/** Violation: command handler without @Transactional. */
public class MutableCommandHandler implements Command.Handler<MutableCommand, String> {

    @Override
    public String handle(MutableCommand command) {
        return "";
    }
}
