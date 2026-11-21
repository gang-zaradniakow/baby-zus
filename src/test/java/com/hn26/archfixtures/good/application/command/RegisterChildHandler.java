package com.hn26.archfixtures.good.application.command;

import an.awesome.pipelinr.Command;
import org.springframework.transaction.annotation.Transactional;

class RegisterChildHandler implements Command.Handler<RegisterChild, String> {

    @Override
    @Transactional
    public String handle(RegisterChild command) {
        return command.name();
    }
}
