package com.hn26.archfixtures.good.application.handler;

import an.awesome.pipelinr.Command;
import com.hn26.archfixtures.good.application.command.RegisterChild;
import org.springframework.transaction.annotation.Transactional;

class RegisterChildHandler implements Command.Handler<RegisterChild, String> {

    @Override
    @Transactional
    public String handle(RegisterChild command) {
        return command.name();
    }
}
